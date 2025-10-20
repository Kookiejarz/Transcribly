from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import assemblyai as aai

from .config import settings


@dataclass
class RequestOptions:
    """Holds per-request configuration overrides."""

    api_key: Optional[str] = None
    assembly_api_key: Optional[str] = None
    assembly_model: Optional[str] = None
    stt_model: Optional[str] = None
    summary_model: Optional[str] = None
    summary_max_tokens: Optional[int] = None
    provider: Optional[str] = None

    def resolved_api_key(self) -> str:
        key = self.api_key or settings.openai_api_key
        if not key:
            raise ValueError(
                "OpenAI API key is required. Provide it via request or set OPENAI_API_KEY."
            )
        return key

    def resolved_assembly_api_key(self) -> str:
        key = self.assembly_api_key or settings.assemblyai_api_key
        if not key:
            raise ValueError(
                "AssemblyAI API key is required. Provide it via request or set ASSEMBLYAI_API_KEY."
            )
        return key

    def resolved_assembly_model(self) -> aai.SpeechModel:
        model = (self.assembly_model or settings.assembly_model or "universal").lower()
        mapping = {
            "universal": aai.SpeechModel.universal,
            "slam_1": aai.SpeechModel.slam_1,
        }
        if model not in mapping:
            raise ValueError("Invalid AssemblyAI speech model. Expected 'universal' or 'slam_1'.")
        return mapping[model]

    def resolved_transcription_provider(self) -> str:
        provider = (self.provider or settings.transcription_provider or "openai").lower()
        if provider not in {"openai", "assemblyai"}:
            raise ValueError("Invalid transcription provider. Expected 'openai' or 'assemblyai'.")
        return provider

    def resolved_stt_model(self) -> str:
        return self.stt_model or settings.stt_model

    def resolved_summary_model(self) -> str:
        return self.summary_model or settings.summary_model_name

    def resolved_summary_max_tokens(self) -> int:
        tokens = self.summary_max_tokens or settings.summary_max_tokens
        return max(tokens, 50)
