from __future__ import annotations

import asyncio
import io
import logging
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import settings
from .models import (
    ErrorResponse,
    TranscriptionOptions,
    TranscriptionResponse,
    YouTubeTranscriptionRequest,
)
from .options import RequestOptions
from .services import (
    OpenAIClientProvider,
    PDFExportService,
    SessionStore,
    SummarizationService,
    TranscriptionError,
    TranscriptionService,
    YouTubeAudioService,
)

logger = logging.getLogger("transcription-app")
logging.basicConfig(level=settings.log_level)

app = FastAPI(
    title="Transcription API",
    version="1.0.0",
    description="Speech-to-text transcription and summarization service.",
)

cors_allow_origins = settings.cors_allow_origins or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client_provider = OpenAIClientProvider()
transcription_service = TranscriptionService(client_provider=client_provider)
summarization_service = SummarizationService(
    client_provider=client_provider,
)
session_store = SessionStore(ttl_minutes=settings.session_ttl_minutes)
pdf_service = PDFExportService()
youtube_service = YouTubeAudioService(
    output_dir=settings.temp_dir or None,
    fmt=settings.youtube_audio_format,
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/upload-audio",
    response_model=TranscriptionResponse,
    responses={
        400: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def upload_audio(
    request: Request,
    file: UploadFile = File(...),
    api_key: str | None = Form(default=None, alias="apiKey"),
    stt_model: str | None = Form(default=None, alias="sttModel"),
    summary_model: str | None = Form(default=None, alias="summaryModel"),
    summary_max_tokens: int | None = Form(default=None, alias="summaryMaxTokens"),
) -> TranscriptionResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File name missing.")

    if file.content_type and not file.content_type.startswith("audio"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only audio uploads are supported.",
        )

    options = build_request_options(
        request,
        TranscriptionOptions(
            api_key=api_key,
            stt_model=stt_model,
            summary_model=summary_model,
            summary_max_tokens=summary_max_tokens,
        ),
    )

    try:
        transcript = await transcription_service.transcribe_upload(file, options)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except TranscriptionError as exc:
        logger.exception("Transcription failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected transcription failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc

    try:
        summary = await summarization_service.summarize(transcript, options)
    except Exception as exc:
        logger.exception("Summarization failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization failed: {exc}",
        ) from exc
    session_id = session_store.create(transcript, summary)
    return TranscriptionResponse(
        session_id=session_id,
        transcript=transcript,
        summary=summary,
    )


@app.post(
    "/youtube-transcribe",
    response_model=TranscriptionResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def youtube_transcribe(
    request: Request, payload: YouTubeTranscriptionRequest
) -> TranscriptionResponse:
    audio_path: Path | None = None
    options = RequestOptions(
        api_key=payload.api_key or request.headers.get("X-API-Key"),
        stt_model=payload.stt_model,
        summary_model=payload.summary_model,
        summary_max_tokens=payload.summary_max_tokens,
    )
    try:
        audio_path = await youtube_service.download_audio(str(payload.url))
        transcript = await transcription_service.transcribe_path(audio_path, options)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except TranscriptionError as exc:
        logger.exception("YouTube transcription failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        ) from exc
    finally:
        if audio_path:
            await youtube_service.cleanup_path(audio_path)

    try:
        summary = await summarization_service.summarize(transcript, options)
    except Exception as exc:
        logger.exception("Summarization failure")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization failed: {exc}",
        ) from exc
    session_id = session_store.create(transcript, summary)
    return TranscriptionResponse(
        session_id=session_id,
        transcript=transcript,
        summary=summary,
    )


@app.get(
    "/download-pdf",
    responses={404: {"model": ErrorResponse}},
)
async def download_pdf(session_id: str = Query(..., description="Session identifier.")):
    record = session_store.get(session_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or expired.")

    transcript, summary = record
    pdf_bytes = await asyncio.to_thread(
        pdf_service.build_pdf, transcript, summary, session_id=session_id
    )
    stream = io.BytesIO(pdf_bytes)

    headers = {
        "Content-Disposition": f'attachment; filename="transcript-{session_id}.pdf"'
    }
    return StreamingResponse(stream, media_type="application/pdf", headers=headers)


def build_request_options(request: Request, payload: TranscriptionOptions) -> RequestOptions:
    header_key = request.headers.get("X-API-Key")
    return RequestOptions(
        api_key=payload.api_key or header_key,
        stt_model=payload.stt_model,
        summary_model=payload.summary_model,
        summary_max_tokens=payload.summary_max_tokens,
    )
