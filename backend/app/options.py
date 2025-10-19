from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .config import settings


@dataclass
class RequestOptions:
    """Holds per-request configuration overrides."""

    api_key: Optional[str] = None
    stt_model: Optional[str] = None
    summary_model: Optional[str] = None
    summary_max_tokens: Optional[int] = None

    def resolved_api_key(self) -> str:
        key = self.api_key or settings.openai_api_key
        if not key:
            raise ValueError(
                "OpenAI API key is required. Provide it via request or set OPENAI_API_KEY."
            )
        return key

    def resolved_stt_model(self) -> str:
        return self.stt_model or settings.stt_model

    def resolved_summary_model(self) -> str:
        return self.summary_model or settings.summary_model_name

    def resolved_summary_max_tokens(self) -> int:
        tokens = self.summary_max_tokens or settings.summary_max_tokens
        return max(tokens, 50)
