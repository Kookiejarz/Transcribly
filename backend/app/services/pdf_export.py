from __future__ import annotations

import io
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
        pdf.multi_cell(0, 7, summary or "No summary available.")

        pdf.ln(5)
        pdf.set_font("Helvetica", "B", 12)
        pdf.multi_cell(0, 8, "Transcript")
        pdf.set_font("Helvetica", size=11)
        pdf.multi_cell(0, 6, transcript or "No transcript available.")

        buffer = io.BytesIO()
        pdf.output(buffer)
        buffer.seek(0)
        return buffer.read()
