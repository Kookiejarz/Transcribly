from __future__ import annotations

import asyncio
import os
import tempfile
from pathlib import Path
from typing import Optional

import assemblyai as aai
from fastapi import UploadFile

from ..config import settings
from ..options import RequestOptions
from .openai_client import AssemblyAIClientProvider, OpenAIClientProvider


class TranscriptionError(Exception):
    """Raised when audio transcription fails."""


class TranscriptionService:
    """Handles audio transcription via configurable speech-to-text providers."""

    def __init__(
        self,
        temp_dir: Optional[str] = settings.temp_dir,
        max_upload_size_mb: int = settings.max_upload_size_mb,
        client_provider: Optional[OpenAIClientProvider] = None,
        assembly_client_provider: Optional[AssemblyAIClientProvider] = None,
    ) -> None:
        self._temp_dir = Path(temp_dir) if temp_dir else Path(tempfile.gettempdir())
        self._max_upload_bytes = max_upload_size_mb * 1024 * 1024
        self._client_provider = client_provider or OpenAIClientProvider()
        self._assembly_provider = assembly_client_provider or AssemblyAIClientProvider()

    async def transcribe_upload(self, upload: UploadFile, options: RequestOptions) -> str:
        filename = upload.filename or "audio"
        suffix = Path(filename).suffix or ".mp3"

        loop = asyncio.get_running_loop()
        temp_path: Optional[Path] = None
        try:
            temp_path = await loop.run_in_executor(
                None, self._write_temp_file, upload, suffix
            )
            return await self.transcribe_path(temp_path, options)
        finally:
            if temp_path:
                await asyncio.to_thread(self._safe_unlink, temp_path)
            await upload.close()

    async def transcribe_path(self, file_path: Path | str, options: RequestOptions) -> str:
        path = Path(file_path)
        if not path.exists():
            raise TranscriptionError(f"Audio file not found: {path}")
        provider = options.resolved_transcription_provider()
        if provider == "assemblyai":
            return await asyncio.to_thread(self._transcribe_with_assemblyai, path, options)
        return await asyncio.to_thread(self._transcribe_with_openai, path, options)

    def _write_temp_file(self, upload: UploadFile, suffix: str) -> Path:
        upload.file.seek(0)
        total = 0
        os.makedirs(self._temp_dir, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix, dir=self._temp_dir
        ) as temp_file:
            while True:
                chunk = upload.file.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > self._max_upload_bytes:
                    raise ValueError(
                        f"File exceeds maximum size of {self._max_upload_bytes / (1024 * 1024):.0f} MB"
                    )
                temp_file.write(chunk)
            return Path(temp_file.name)

    def _transcribe_with_openai(self, file_path: Path, options: RequestOptions) -> str:
        client = self._client_provider.create_client(options.resolved_api_key())

        try:
            with file_path.open("rb") as audio_file:
                response = client.audio.transcriptions.create(
                    model=options.resolved_stt_model(),
                    file=audio_file,
                )
        except Exception as exc:  # pragma: no cover - API error handling
            raise TranscriptionError(f"Transcription request failed: {exc}") from exc

        text = getattr(response, "text", None) or getattr(response, "output_text", None)
        if not text:
            raise TranscriptionError("Received empty transcript from transcription API.")
        return text.strip()

    def _transcribe_with_assemblyai(self, file_path: Path, options: RequestOptions) -> str:
        if not self._assembly_provider:
            raise TranscriptionError("AssemblyAI transcription provider is not configured.")

        try:
            transcriber = self._assembly_provider.create_client(options.resolved_assembly_api_key())
        except ValueError as exc:
            raise TranscriptionError(str(exc)) from exc

        config = aai.TranscriptionConfig(speech_model=options.resolved_assembly_model())

        try:
            transcript = transcriber.transcribe(str(file_path), config=config)
        except Exception as exc:  # pragma: no cover - API error handling
            raise TranscriptionError(f"AssemblyAI transcription failed: {exc}") from exc

        if transcript.status == aai.TranscriptStatus.error:
            raise TranscriptionError(f"AssemblyAI transcription failed: {transcript.error}")
        if not transcript.text:
            raise TranscriptionError("Received empty transcript from AssemblyAI.")
        return transcript.text.strip()

    @staticmethod
    def _safe_unlink(path: Path) -> None:
        if not path:
            return
        try:
            path.unlink(missing_ok=True)  # type: ignore[call-arg]
        except TypeError:
            if path.exists():
                path.unlink()


async def transcribe_audio(
    file_bytes: bytes,
    api_key: Optional[str] = None,
    model_name: Optional[str] = None,
    provider: Optional[str] = None,
    assembly_api_key: Optional[str] = None,
    assembly_model: Optional[str] = None,
) -> str:
    """Transcribe audio using the configured provider."""
    resolved_provider = (provider or settings.transcription_provider).lower()
    options = RequestOptions(
        api_key=api_key,
        stt_model=model_name,
        provider=resolved_provider,
        assembly_api_key=assembly_api_key,
        assembly_model=assembly_model,
    )
    service = TranscriptionService()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
        tmp_file.write(file_bytes)
        tmp_file.flush()
        temp_path = Path(tmp_file.name)

    try:
        return await service.transcribe_path(temp_path, options)
    finally:
        try:
            temp_path.unlink(missing_ok=True)  # type: ignore[call-arg]
        except TypeError:
            if temp_path.exists():
                temp_path.unlink()
