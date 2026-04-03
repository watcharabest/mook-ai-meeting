"""Celery app definition for the worker process."""

from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "curator",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Bangkok",
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    # Task settings
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_time_limit=1800,       # 30 min max per task
    task_soft_time_limit=1500,  # 25 min soft limit
    # Upstash Redis TLS
    broker_use_ssl={"ssl_cert_reqs": "CERT_NONE"} if settings.redis_url.startswith("rediss://") else None,
    redis_backend_use_ssl={"ssl_cert_reqs": "CERT_NONE"} if settings.redis_url.startswith("rediss://") else None,
)
