from __future__ import annotations

import asyncio
from typing import List

from ..config import settings
from ..options import RequestOptions
from .openai_client import OpenAIClientProvider


class SummarizationService:
    """Generates summaries for transcripts using the OpenAI text models."""

    def __init__(
        self,
        default_model: str = settings.summary_model_name,
        chunk_words: int = settings.summary_chunk_words,
        client_provider: OpenAIClientProvider | None = None,
    ) -> None:
        self._default_model = default_model
        self._chunk_words = max(chunk_words, 80)
        self._client_provider = client_provider or OpenAIClientProvider()

    async def summarize(self, transcript: str, options: RequestOptions) -> str:
        transcript = (transcript or "").strip()
        if not transcript:
            return ""

        return await asyncio.to_thread(self._summarize_blocking, transcript, options)

    def _summarize_blocking(self, transcript: str, options: RequestOptions) -> str:
        chunks = self._chunk_transcript(transcript)
        client = self._client_provider.create_client(options.resolved_api_key())
        summaries: List[str] = []

        for chunk in chunks:
            prompt = self._build_prompt(chunk)
            response = client.responses.create(
                model=options.resolved_summary_model(),
                input=prompt,
                max_output_tokens=options.resolved_summary_max_tokens(),
                temperature=0.2,
            )
            text = getattr(response, "output_text", "").strip()
            if not text:
                continue
            summaries.append(text)

        if not summaries:
            return ""

        if len(summaries) == 1:
            return summaries[0]

        combined = " ".join(summaries)
        combined_prompt = self._build_prompt(combined, is_revision=True)
        combined_response = client.responses.create(
            model=options.resolved_summary_model(),
            input=combined_prompt,
            max_output_tokens=options.resolved_summary_max_tokens(),
            temperature=0.2,
        )
        return getattr(combined_response, "output_text", combined).strip()

    def _chunk_transcript(self, text: str) -> List[str]:
        words = text.split()
        if len(words) <= self._chunk_words:
            return [text]

        chunks: List[str] = []
        step = self._chunk_words
        overlap = min(120, int(self._chunk_words * 0.2))

        for start in range(0, len(words), step - overlap):
            slice_words = words[start : start + self._chunk_words]
            if not slice_words:
                break
            chunks.append(" ".join(slice_words))
            if start + self._chunk_words >= len(words):
                break

        return chunks or [text]

    @staticmethod
    def _build_prompt(text: str, *, is_revision: bool = False):
        system_instruction = (
            "You are an assistant that produces clear, concise summaries. "
            "Highlight key themes, actions, and decisions. Use bullet points when helpful."
        )
        user_prompt = (
            "Summarize the following transcript segment in 3-6 sentences. "
            "Preserve key facts, speaker intents, and actionable items.\n\n"
            f"Transcript:\n{text.strip()}"
        )
        if is_revision:
            user_prompt = (
                "Combine the partial summaries below into a single cohesive summary. "
                "Avoid duplication and keep it easy to scan.\n\n"
                f"Partial summaries:\n{text.strip()}"
            )

        return [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ]
