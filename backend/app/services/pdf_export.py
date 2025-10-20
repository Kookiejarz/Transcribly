from __future__ import annotations

import textwrap
from typing import Optional

from fpdf import FPDF


class PDFExportService:
    """Renders transcripts and summaries into a simple PDF."""

    def __init__(self, title: str = "Transcription Summary") -> None:
        self._title = title

    def build_pdf(self, transcript: str, summary: str, *, session_id: Optional[str] = None) -> bytes:
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        pdf.set_title(self._title)
        pdf.set_author("Transcription Service")

        pdf.set_font("Helvetica", "B", 16)
        pdf.multi_cell(0, 10, self._title)

        if session_id:
            pdf.set_font("Helvetica", size=10)
            pdf.ln(2)
            pdf.multi_cell(0, 8, f"Session: {session_id}")

        pdf.ln(5)
        pdf.set_font("Helvetica", "B", 12)
        pdf.multi_cell(0, 8, "Summary")
        pdf.set_font("Helvetica", size=11)
        summary_text = self._wrap_text(self._sanitize_text(summary))
        if not summary_text.strip():
            summary_text = self._wrap_text("No summary available.")
        pdf.multi_cell(0, 7, summary_text)

        pdf.ln(5)
        pdf.set_font("Helvetica", "B", 12)
        pdf.multi_cell(0, 8, "Transcript")
        pdf.set_font("Helvetica", size=11)
        transcript_text = self._wrap_text(self._sanitize_text(transcript))
        if not transcript_text.strip():
            transcript_text = self._wrap_text("No transcript available.")
        pdf.multi_cell(0, 6, transcript_text)

        raw = pdf.output(dest="S")
        if isinstance(raw, str):
            return raw.encode("latin-1", "replace")
        return bytes(raw)

    @staticmethod
    def _sanitize_text(value: str | None) -> str:
        if not value:
            return ""
        normalized = value.replace("\r\n", "\n").strip()
        return normalized.encode("latin-1", "replace").decode("latin-1")

    @staticmethod
    def _wrap_text(value: str, width: int = 60) -> str:
        if not value:
            return ""

        wrapped_lines: list[str] = []
        for paragraph in value.split("\n"):
            cleaned = paragraph.strip()
            if not cleaned:
                wrapped_lines.append("")
                continue
            wrapped_lines.extend(
                textwrap.wrap(
                    PDFExportService._split_long_tokens(cleaned, width),
                    width=width,
                    break_long_words=True,
                    break_on_hyphens=True,
                    replace_whitespace=False,
                )
            )

        return "\n".join(wrapped_lines)

    @staticmethod
    def _split_long_tokens(value: str, width: int) -> str:
        tokens = value.split(" ")
        normalized: list[str] = []
        for token in tokens:
            if len(token) <= width:
                normalized.append(token)
            else:
                normalized.extend(token[i : i + width] for i in range(0, len(token), width))
        return " ".join(normalized)
