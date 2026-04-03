"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


# ── Request Schemas ──────────────────────────────────

class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    language: str = Field(default="auto", pattern=r"^(auto|th|en|ja|zh|ko)$")
    audio_filename: str = Field(..., min_length=1, max_length=500)
    audio_size_bytes: Optional[int] = Field(default=None, ge=0)
    content_type: str = Field(default="audio/mpeg")


class JobStartRequest(BaseModel):
    """Sent after the frontend finishes uploading to Supabase Storage."""
    pass


# ── Response Schemas ─────────────────────────────────

class JobCreateResponse(BaseModel):
    id: str
    upload_url: str       # Supabase Storage signed upload URL (legacy)
    upload_token: str     # JWT token for uploadToSignedUrl
    storage_path: str     # the storage path in Supabase


class JobResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    status: str
    progress: int = 0
    error_message: Optional[str] = None

    audio_filename: Optional[str] = None
    audio_size_bytes: Optional[int] = None
    audio_duration_seconds: Optional[float] = None

    transcript: Optional[str] = None
    utterances: Optional[Any] = None  # JSONB -> list of dicts
    summary: Optional[Any] = None     # JSONB -> dict

    language: str = "auto"
    detected_language: Optional[str] = None

    created_at: str
    updated_at: str
    completed_at: Optional[str] = None


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int


class DownloadUrlResponse(BaseModel):
    download_url: str


class MessageResponse(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
