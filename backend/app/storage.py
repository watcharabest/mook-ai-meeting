"""Supabase Storage client for audio file management."""

from app.config import get_settings
from app.db import get_supabase


def generate_upload_url(
    storage_path: str,
    expires_in: int = 3600,
) -> dict:
    """Generate a signed URL for uploading audio to Supabase Storage.
    Returns dict with 'signed_url' and 'token' keys.
    """
    settings = get_settings()
    db = get_supabase()
    result = db.storage.from_(settings.supabase_storage_bucket).create_signed_upload_url(
        storage_path
    )
    signed_url = result["signed_url"]
    # Extract the token from the URL query string
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(signed_url)
    token = parse_qs(parsed.query).get("token", [""])[0]
    return {"signed_url": signed_url, "token": token}


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
