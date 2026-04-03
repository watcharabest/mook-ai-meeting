"""Celery tasks for meeting transcription and summarization."""

import logging
from datetime import datetime, timezone

from supabase import create_client

from app.celery_app import celery_app
from app.config import get_settings
from app.gladia_client import transcribe_audio
from app.gemini_client import summarize_transcript

logger = logging.getLogger(__name__)


def _get_supabase():
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


def _update_job(job_id: str, **kwargs):
    """Update job fields in Supabase."""
    db = _get_supabase()
    db.table("jobs").update(kwargs).eq("id", job_id).execute()


def _generate_download_url(storage_path: str) -> str:
    """Generate a signed download URL from Supabase Storage."""
    settings = get_settings()
    db = _get_supabase()
    result = db.storage.from_(settings.supabase_storage_bucket).create_signed_url(
        storage_path, 3600  # 1 hour expiry
    )
    return result["signedURL"]


def _delete_audio(storage_path: str) -> None:
    """Delete audio file from Supabase Storage after processing."""
    settings = get_settings()
    db = _get_supabase()
    db.storage.from_(settings.supabase_storage_bucket).remove([storage_path])


@celery_app.task(
    name="worker.tasks.process_job",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
    queue="transcription",
)
def process_job(self, job_id: str):
    """
    Main worker pipeline:
    1. Generate signed URL from Supabase Storage
    2. Send to Gladia API → transcript + speaker diarization
    3. Send to Gemini API → summary + action items
    4. Save results to Supabase
    5. Delete audio file from Storage (save space)
    """
    logger.info(f"Processing job: {job_id}")

    try:
        # ── Fetch job details ────────────────────────
        db = _get_supabase()
        result = db.table("jobs").select("*").eq("id", job_id).single().execute()
        if not result.data:
            logger.error(f"Job {job_id} not found")
            return

        job = result.data
        storage_path = job.get("audio_storage_path")
        language = job.get("language", "auto")

        if not storage_path:
            _update_job(job_id, status="failed", error_message="No audio file associated")
            return

        # ── Step 1: Generate signed URL for Gladia ─
        _update_job(job_id, status="transcribing", progress=10)
        logger.info(f"Generating signed URL for: {storage_path}")
        audio_url = _generate_download_url(storage_path)

        # ── Step 2: Transcribe via Gladia ────────────
        _update_job(job_id, progress=20)
        logger.info("Sending to Gladia for transcription...")

        gladia_result = transcribe_audio(
            audio_url=audio_url,
            language=language,
        )

        full_transcript = gladia_result["full_transcript"]
        utterances = gladia_result["utterances"]
        detected_language = gladia_result.get("detected_language")
        audio_duration = gladia_result.get("audio_duration")

        logger.info(
            f"Gladia done: {len(utterances)} utterances, "
            f"language={detected_language}, duration={audio_duration}s"
        )

        # Save transcript immediately (partial progress)
        _update_job(
            job_id,
            status="summarizing",
            progress=60,
            transcript=full_transcript,
            utterances=utterances,
            detected_language=detected_language,
            audio_duration_seconds=audio_duration,
        )

        # ── Step 3: Summarize via Gemini ─────────────
        logger.info("Sending to Gemini for summarization...")
        _update_job(job_id, progress=70)

        summary = summarize_transcript(
            transcript=full_transcript,
            utterances=utterances,
            language=detected_language,
        )

        logger.info("Gemini summarization complete")

        # ── Step 4: Save final results ───────────────
        _update_job(
            job_id,
            status="completed",
            progress=100,
            summary=summary,
            completed_at=datetime.now(timezone.utc).isoformat(),
        )

        logger.info(f"Job {job_id} completed successfully!")

        # ── Step 5: Delete audio file (save storage space) ─
        try:
            _delete_audio(storage_path)
            logger.info(f"Deleted audio file: {storage_path}")
        except Exception as e:
            logger.warning(f"Failed to delete audio file: {e}")

    except Exception as e:
        logger.exception(f"Job {job_id} failed: {e}")
        _update_job(
            job_id,
            status="failed",
            error_message=str(e)[:1000],
        )
        # Retry on transient errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
