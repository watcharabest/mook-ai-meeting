"""Gladia API client for transcription + speaker diarization."""

import httpx
import time
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)

GLADIA_BASE_URL = "https://api.gladia.io/v2"


def transcribe_audio(
    audio_url: str,
    language: str = "auto",
    max_speakers: int = 10,
) -> dict:
    """
    Send audio to Gladia for transcription + speaker diarization.

    Args:
        audio_url: Presigned R2 URL for the audio file
        language: Language code or 'auto' for auto-detection
        max_speakers: Maximum number of speakers to detect

    Returns:
        dict with keys: full_transcript, utterances, detected_language, audio_duration
    """
    settings = get_settings()
    headers = {
        "x-gladia-key": settings.gladia_api_key,
        "Content-Type": "application/json",
    }

    # Step 1: Create transcription request
    payload: dict = {
        "audio_url": audio_url,
        "diarization": True,
        "diarization_config": {
            "max_speakers": max_speakers,
        },
    }

    # Set language (None = auto-detect)
    if language and language != "auto":
        payload["language"] = language

    logger.info("Submitting transcription to Gladia...")
    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f"{GLADIA_BASE_URL}/transcription",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    result_url = data["result_url"]
    logger.info(f"Gladia job created. Polling: {result_url}")

    # Step 2: Poll for results
    with httpx.Client(timeout=30.0) as client:
        for attempt in range(120):  # Max ~10 minutes polling
            time.sleep(5)

            poll_response = client.get(result_url, headers=headers)
            poll_response.raise_for_status()
            poll_data = poll_response.json()

            status = poll_data.get("status")
            logger.info(f"Gladia poll #{attempt + 1}: status={status}")

            if status == "done":
                result = poll_data["result"]
                transcription = result["transcription"]

                # Extract utterances with speaker labels
                utterances = []
                for utterance in transcription.get("utterances", []):
                    utterances.append({
                        "speaker": utterance.get("speaker", 0),
                        "text": utterance.get("text", ""),
                        "start": utterance.get("start", 0),
                        "end": utterance.get("end", 0),
                        "confidence": utterance.get("confidence", 0),
                    })

                return {
                    "full_transcript": transcription.get("full_transcript", ""),
                    "utterances": utterances,
                    "detected_language": transcription.get("languages", [{}])[0].get("language") if transcription.get("languages") else None,
                    "audio_duration": result.get("metadata", {}).get("audio_duration"),
                }

            elif status == "error":
                error_msg = poll_data.get("error", "Unknown Gladia error")
                raise Exception(f"Gladia transcription failed: {error_msg}")

    raise TimeoutError("Gladia transcription timed out after 10 minutes")
