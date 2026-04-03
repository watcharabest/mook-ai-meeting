from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_storage_bucket: str = "audio-files"

    # Upstash Redis
    redis_url: str

    # Gladia
    gladia_api_key: str

    # Gemini
    gemini_api_key: str

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
