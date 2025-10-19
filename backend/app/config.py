from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()


def _parse_origins(raw: str | None) -> List[str]:
    if not raw:
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@dataclass
class Settings:
    """Simple settings object sourcing values from environment variables."""

    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_api_base: Optional[str] = os.getenv("OPENAI_API_BASE") or None
    stt_model: str = os.getenv("STT_MODEL_NAME", "gpt-4o-mini-transcribe")
    summary_model_name: str = os.getenv("SUMMARY_MODEL_NAME", "gpt-4o-mini")
    summary_chunk_words: int = int(os.getenv("SUMMARY_CHUNK_WORDS", "1200"))
    summary_max_tokens: int = int(os.getenv("SUMMARY_MAX_TOKENS", "300"))
    youtube_audio_format: str = os.getenv("YOUTUBE_AUDIO_FORMAT", "bestaudio/best")
    session_ttl_minutes: int = int(os.getenv("SESSION_TTL_MINUTES", "240"))
    cors_allow_origins: List[str] = field(
        default_factory=lambda: _parse_origins(os.getenv("CORS_ALLOW_ORIGINS"))
    )
    temp_dir: str = os.getenv("TRANSCRIPTION_TEMP_DIR", "")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "200"))
    request_timeout_seconds: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "600"))


settings = Settings()
