"""API routes for job management."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.celery_client import enqueue_transcription
from app.db import get_supabase
from app.schemas import (
    DownloadUrlResponse,
    JobCreateRequest,
    JobCreateResponse,
    JobListResponse,
    JobResponse,
    MessageResponse,
)
from app.storage import (
    delete_storage_object,
    generate_download_url,
    generate_upload_url,
)

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("", response_model=JobCreateResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    body: JobCreateRequest,
    user: dict = Depends(get_current_user),
):
    """
    Create a new job record and return a Supabase Storage signed upload URL.
    The frontend uploads the audio file directly to Supabase Storage using this URL.
    """
    user_id = user["user_id"]
    job_id = str(uuid4())

    # Create storage path: {user_id}/{job_id}/{filename}
    storage_path = f"{user_id}/{job_id}/{body.audio_filename}"

    # Generate signed upload URL
    upload_url = generate_upload_url(storage_path=storage_path)

    # Insert job record into Supabase
    db = get_supabase()
    result = (
        db.table("jobs")
        .insert(
            {
                "id": job_id,
                "user_id": user_id,
                "title": body.title,
                "description": body.description,
                "status": "created",
                "progress": 0,
                "language": body.language,
                "audio_filename": body.audio_filename,
                "audio_size_bytes": body.audio_size_bytes,
                "audio_storage_path": storage_path,
            }
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job record",
        )

    return JobCreateResponse(
        id=job_id,
        upload_url=upload_url,
        storage_path=storage_path,
    )


@router.post("/{job_id}/start", response_model=MessageResponse)
def start_job(
    job_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Called after the frontend finishes uploading to Supabase Storage.
    Enqueues the Celery task for transcription + summarization.
    """
    db = get_supabase()

    # Verify job exists and belongs to user
    result = db.table("jobs").select("*").eq("id", job_id).maybe_single().execute()
    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data
    if job["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    if job["status"] not in ("created", "uploaded"):
        raise HTTPException(
            status_code=400,
            detail=f"Job cannot be started in '{job['status']}' state",
        )

    # Update status to queued
    db.table("jobs").update({"status": "queued", "progress": 5}).eq(
        "id", job_id
    ).execute()

    # Enqueue Celery task
    task_id = enqueue_transcription(job_id)

    return MessageResponse(message=f"Job queued. Task ID: {task_id}")


@router.get("", response_model=JobListResponse)
def list_jobs(
    user: dict = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
):
    """List all jobs for the authenticated user."""
    db = get_supabase()
    user_id = user["user_id"]

    # Get total count
    count_result = (
        db.table("jobs").select("id", count="exact").eq("user_id", user_id).execute()
    )
    total = count_result.count or 0

    # Get paginated results
    result = (
        db.table("jobs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    jobs = [_row_to_job_response(row) for row in (result.data or [])]
    return JobListResponse(jobs=jobs, total=total)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single job by ID."""
    db = get_supabase()

    result = db.table("jobs").select("*").eq("id", job_id).maybe_single().execute()
    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data
    if job["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return _row_to_job_response(job)


@router.delete("/{job_id}", response_model=MessageResponse)
def delete_job(
    job_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a job and its associated audio file in Supabase Storage."""
    db = get_supabase()

    result = db.table("jobs").select("*").eq("id", job_id).maybe_single().execute()
    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data
    if job["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete storage object if exists
    if job.get("audio_storage_path"):
        try:
            delete_storage_object(job["audio_storage_path"])
        except Exception:
            pass  # Best-effort deletion

    # Delete job record
    db.table("jobs").delete().eq("id", job_id).execute()

    return MessageResponse(message="Job deleted successfully")


# ── Storage Routes ───────────────────────────────────

storage_router = APIRouter(prefix="/api/storage", tags=["Storage"])


@storage_router.get("/download/{job_id}", response_model=DownloadUrlResponse)
def get_download_url(
    job_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a signed download URL for the original audio file."""
    db = get_supabase()

    result = db.table("jobs").select("*").eq("id", job_id).maybe_single().execute()
    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    job = result.data
    if job["user_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    if not job.get("audio_storage_path"):
        raise HTTPException(status_code=404, detail="Audio file not found")

    download_url = generate_download_url(job["audio_storage_path"])
    return DownloadUrlResponse(download_url=download_url)


# ── Helpers ──────────────────────────────────────────


def _row_to_job_response(row: dict) -> JobResponse:
    """Convert a Supabase row to a JobResponse."""
    return JobResponse(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        description=row.get("description"),
        status=row["status"],
        progress=row.get("progress", 0),
        error_message=row.get("error_message"),
        audio_filename=row.get("audio_filename"),
        audio_size_bytes=row.get("audio_size_bytes"),
        audio_duration_seconds=row.get("audio_duration_seconds"),
        transcript=row.get("transcript"),
        utterances=row.get("utterances"),
        summary=row.get("summary"),
        language=row.get("language", "auto"),
        detected_language=row.get("detected_language"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        completed_at=row.get("completed_at"),
    )
