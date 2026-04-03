"""Supabase Storage client for audio file management."""

from app.config import get_settings
from app.db import get_supabase


def generate_upload_url(
    storage_path: str,
    expires_in: int = 3600,
) -> str:
    """Generate a signed URL for uploading audio to Supabase Storage."""
    settings = get_settings()
    db = get_supabase()
    result = db.storage.from_(settings.supabase_storage_bucket).create_signed_upload_url(
        storage_path
    )
    return result["signed_url"]


def generate_download_url(
    storage_path: str,
    expires_in: int = 3600,
) -> str:
    """Generate a signed URL for downloading audio from Supabase Storage."""
    settings = get_settings()
    db = get_supabase()
    result = db.storage.from_(settings.supabase_storage_bucket).create_signed_url(
        storage_path, expires_in
    )
    return result["signedURL"]


def delete_storage_object(storage_path: str) -> None:
    """Delete an object from Supabase Storage."""
    settings = get_settings()
    db = get_supabase()
    db.storage.from_(settings.supabase_storage_bucket).remove([storage_path])
