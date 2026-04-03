"""The Curator AI — FastAPI Backend."""

import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings
from app.routes import router as jobs_router, storage_router
from app.schemas import HealthResponse

app = FastAPI(
    title="The Curator AI",
    description="AI-powered meeting transcription and summarization API",
    version="0.1.0",
)

# CORS — build origin list from FRONTEND_URL (supports comma-separated values)
settings = get_settings()
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

# Support comma-separated FRONTEND_URL for multiple origins
for url in settings.frontend_url.split(","):
    url = url.strip()
    if url and url not in allowed_origins:
        allowed_origins.append(url)

# Vercel preview deployment pattern
VERCEL_PATTERN = re.compile(r"^https://[\w-]+\.vercel\.app$")


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """Allow any *.vercel.app origin in addition to the explicit list."""

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        is_allowed = origin in allowed_origins or VERCEL_PATTERN.match(origin)

        if request.method == "OPTIONS" and is_allowed:
            response = Response(status_code=200)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "600"
            return response

        response = await call_next(request)

        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"

        return response


app.add_middleware(DynamicCORSMiddleware)

# Routes
app.include_router(jobs_router)
app.include_router(storage_router)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    return HealthResponse(status="ok", version="0.1.0")
