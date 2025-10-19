from __future__ import annotations

from typing import Optional

from openai import OpenAI

from ..config import settings


class OpenAIClientProvider:
    """Creates OpenAI API clients with per-request overrides."""

    def __init__(
        self,
        default_api_key: str = settings.openai_api_key,
        api_base: Optional[str] = settings.openai_api_base,
        timeout: float = settings.request_timeout_seconds,
    ) -> None:
        self._default_api_key = default_api_key
        self._api_base = api_base
        self._timeout = timeout

    def create_client(self, api_key: Optional[str] = None) -> OpenAI:
        key = api_key or self._default_api_key
        if not key:
            raise ValueError("OpenAI API key is required.")

        kwargs: dict[str, object] = {"api_key": key, "timeout": self._timeout}
        if self._api_base:
            kwargs["base_url"] = self._api_base

        return OpenAI(**kwargs)
