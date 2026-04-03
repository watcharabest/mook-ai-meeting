"""Celery app configuration (client-side — for enqueuing tasks)."""

from celery import Celery
from app.config import get_settings


def get_celery_app() -> Celery:
    settings = get_settings()
    celery_app = Celery(
        "curator",
        broker=settings.redis_url,
        backend=settings.redis_url,
    )
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="Asia/Bangkok",
        enable_utc=True,
        broker_connection_retry_on_startup=True,
        # Upstash Redis TLS
        broker_use_ssl={"ssl_cert_reqs": "CERT_NONE"} if settings.redis_url.startswith("rediss://") else None,
        redis_backend_use_ssl={"ssl_cert_reqs": "CERT_NONE"} if settings.redis_url.startswith("rediss://") else None,
    )
    return celery_app


def enqueue_transcription(job_id: str) -> str:
    """Enqueue a transcription task and return the Celery task ID."""
    app = get_celery_app()
    result = app.send_task(
        "worker.tasks.process_job",
        args=[job_id],
        queue="transcription",
    )
    return result.id
