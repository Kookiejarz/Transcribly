from __future__ import annotations

import os
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import BaseSettings, Field

load_dotenv()


def _parse_origins(raw: str | None) -> List[str]:
    if not raw:
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Settings(BaseSettings):
    """Simple settings object sourcing values from environment variables."""

    # OpenAI settings
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_api_base: Optional[str] = Field(default=None, alias="OPENAI_API_BASE")

    # AssemblyAI settings
    assemblyai_api_key: str = Field(default="", alias="ASSEMBLYAI_API_KEY")

    # Transcription provider: "openai" or "assemblyai"
    transcription_provider: str = Field(default="openai", alias="TRANSCRIPTION_PROVIDER")

    stt_model: str = os.getenv("STT_MODEL_NAME", "gpt-4o-transcription")
    assembly_model: str = os.getenv("ASSEMBLYAI_SPEECH_MODEL", "universal")
    summary_model_name: str = os.getenv("SUMMARY_MODEL_NAME", "gpt-4o-mini")
    summary_chunk_words: int = int(os.getenv("SUMMARY_CHUNK_WORDS", "1200"))
    summary_max_tokens: int = int(os.getenv("SUMMARY_MAX_TOKENS", "300"))
    youtube_audio_format: str = os.getenv("YOUTUBE_AUDIO_FORMAT", "bestaudio/best")
    session_ttl_minutes: int = int(os.getenv("SESSION_TTL_MINUTES", "240"))
    cors_allow_origins: List[str] = Field(
        default_factory=lambda: _parse_origins(os.getenv("CORS_ALLOW_ORIGINS"))
    )
    temp_dir: str = os.getenv("TRANSCRIPTION_TEMP_DIR", "")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "200"))
    request_timeout_seconds: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "600"))

settings = Settings()
