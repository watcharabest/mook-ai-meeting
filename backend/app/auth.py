"""JWT authentication — verifies Supabase-issued tokens via JWKS."""

import time
from typing import Optional

import httpx
import jwt
from jwt import PyJWK
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

security = HTTPBearer()

# ── JWKS Cache ───────────────────────────────────────────────────────────
# Cache the public keys so we don't fetch on every request.
_jwks_cache: dict = {}
_jwks_cache_time: float = 0
_JWKS_CACHE_TTL = 3600  # 1 hour


def _get_jwks() -> dict:
    """Fetch and cache the JWKS from the Supabase project."""
    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < _JWKS_CACHE_TTL:
        return _jwks_cache

    settings = get_settings()
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

    resp = httpx.get(jwks_url, timeout=10)
    resp.raise_for_status()

    _jwks_cache = resp.json()
    _jwks_cache_time = now
    return _jwks_cache


def _get_signing_key(token: str) -> PyJWK:
    """Find the correct public key from JWKS that matches the token's kid."""
    jwks = _get_jwks()
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    for key_data in jwks.get("keys", []):
        if key_data.get("kid") == kid:
            return PyJWK(key_data)

    raise jwt.InvalidTokenError(f"No matching key found for kid: {kid}")


# ── Auth Dependency ──────────────────────────────────────────────────────


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Decode and verify the Supabase JWT using the project's JWKS public keys.
    Returns the token payload containing user_id (sub), email, etc.
    """
    token = credentials.credentials

    try:
        # Get the correct public key
        signing_key = _get_signing_key(token)

        # Decode with the public key — supports ES256 (and RS256 if project uses it)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to fetch JWKS: {e}",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user ID",
        )

    return {"user_id": user_id, "email": payload.get("email"), "payload": payload}
