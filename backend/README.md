# Transcription API Backend

This FastAPI service provides speech-to-text transcription, summarisation, YouTube audio ingestion, and PDF export for the TranscribeAI frontend.

## Requirements

- Python 3.10+
- Recommended: virtual environment (e.g. `python -m venv .venv`)

## Installation

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file before running locally or building the Docker image:

```bash
cp .env.example .env
# edit .env and provide at least OPENAI_API_KEY
```

| Variable | Description | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API key used when requests do not provide one | _required unless provided per-request_ |
| `OPENAI_API_BASE` | Custom API base for OpenAI-compatible endpoints | unset |
| `STT_MODEL_NAME` | Default speech-to-text model | `gpt-4o-mini-transcribe` |
| `SUMMARY_MODEL_NAME` | Default summarisation model | `gpt-4o-mini` |
| `SUMMARY_MAX_TOKENS` | Maximum tokens for generated summaries | `300` |
| `SUMMARY_CHUNK_WORDS` | Chunk size (words) for long transcripts | `1200` |
| `REQUEST_TIMEOUT_SECONDS` | Timeout for upstream API calls | `600` |
| `SESSION_TTL_MINUTES` | Lifetime of stored transcript sessions | `240` |
| `YOUTUBE_AUDIO_FORMAT` | yt-dlp format selector | `bestaudio/best` |
| `TRANSCRIPTION_TEMP_DIR` | Directory for temporary audio files | system temp |
| `LOG_LEVEL` | Logging verbosity | `INFO` |
| `MAX_UPLOAD_SIZE_MB` | Maximum upload size accepted | `200` |
| `CORS_ALLOW_ORIGINS` | Comma-separated allowed origins | `*` |

Requests may also include:

- `X-API-Key` header
- JSON body fields `apiKey`, `sttModel`, `summaryModel`, `summaryMaxTokens`
- Multipart form fields with the same names

These override defaults for that request only.

## Running the Server

```bash
cd backend
uvicorn app.main:app --reload
```

The service listens on `http://localhost:8000` by default. The frontend proxy expects this address; override with `TRANSCRIPTION_API_URL` on the Next.js side if needed. Environment variables from `.env` are loaded automatically.

## Docker

Build the image:

```bash
cd backend
docker build -t transcription-backend .
```

Run the container (example using an environment file for secrets):

```bash
docker run \
  --env-file .env \
  -p 8000:8000 \
  transcription-backend
```

Environment variables listed above can be supplied via `--env`, `--env-file`, or your orchestrator. Ensure `OPENAI_API_KEY` is available at runtime. The container exposes port `8000` and starts `uvicorn app.main:app`.

## API Endpoints

- `POST /upload-audio` – multipart audio upload → transcript + summary + session id
- `POST /youtube-transcribe` – JSON payload with `url` → transcript + summary + session id
- `GET /download-pdf?session_id=...` – returns PDF containing transcript and summary
- `GET /health` – health probe

## YouTube Support

`yt-dlp` is required for YouTube downloads. Install `ffmpeg` on the host so audio extraction succeeds.

## PDF Export

The PDF export uses `fpdf2` and includes both transcript and summary. Sessions are stored in-memory; expired sessions are purged automatically.
