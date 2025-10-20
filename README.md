# Transcribly - Audio/Video Transcription & Summarization App

A web application that transcribes and summarizes audio/video content using OpenAI's APIs. Users can upload audio files or provide YouTube URLs to get AI-generated transcripts and summaries with PDF export.

## Features

- 🎙️ **Audio Transcription** - Upload MP3, WAV, MP4, or M4A files
- 🎬 **YouTube Support** - Transcribe videos directly from YouTube URLs
- 📝 **AI Summarization** - Generate concise summaries with chunking for long transcripts
- 📄 **PDF Export** - Download transcripts and summaries as formatted PDFs
- ⚙️ **Configurable** - Customize API keys, models, and parameters per request
- 🎨 **Modern UI** - Clean interface with drag-and-drop, light/dark themes
- 📊 **Progress Tracking** - Real-time upload progress indicators

## Architecture

### Frontend (Next.js 15 + React 19)
- **Framework**: Next.js with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **Key Features**:
  - Drag-and-drop file upload
  - YouTube URL input
  - Real-time progress tracking
  - Copy to clipboard & PDF download
  - Configurable API settings

### Backend (FastAPI + Python)
- **Framework**: FastAPI with async support
- **Core Services**:
  - OpenAI Whisper API integration
  - Text summarization with smart chunking
  - YouTube audio extraction via `yt-dlp`
  - PDF generation with `fpdf2`
  - In-memory session management

## Quick Start

### Prerequisites

- **Node.js** 18+ and `pnpm`
- **Python** 3.10+
- **OpenAI API Key**
- **ffmpeg** (for YouTube support)

### Frontend Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Frontend runs on `http://localhost:3000`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the server
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `OPENAI_API_BASE` | Custom API base for compatible endpoints | - |
| `STT_MODEL_NAME` | Speech-to-text model | `gpt-4o-mini-transcribe` |
| `SUMMARY_MODEL_NAME` | Summarization model | `gpt-4o-mini` |
| `SUMMARY_MAX_TOKENS` | Max tokens for summaries | `300` |
| `SUMMARY_CHUNK_WORDS` | Chunk size for long transcripts | `1200` |
| `REQUEST_TIMEOUT_SECONDS` | API call timeout | `600` |
| `SESSION_TTL_MINUTES` | Session lifetime | `240` |
| `MAX_UPLOAD_SIZE_MB` | File size limit | `200` |
| `CORS_ALLOW_ORIGINS` | Allowed origins | `*` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

### Frontend Environment Variables

Create a `.env.local` file in the project root (optional):

```bash
TRANSCRIPTION_API_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_STT_MODEL=gpt-4o-mini-transcribe
NEXT_PUBLIC_DEFAULT_SUMMARY_MODEL=gpt-4o-mini
NEXT_PUBLIC_DEFAULT_SUMMARY_MAX_TOKENS=300
```

### Branding & Icons

Update `public/site-config.json` to change the app name, tagline, or icon paths:

```json
{
  "name": "Transcribly",
  "tagline": "Transcribe and summarize audio & video content",
  "assets": {
    "logo": "/logo.svg",
    "logoDark": "/logo-dark.svg",
    "favicon": "/favicon.svg",
    "appleTouchIcon": "/apple-touch-icon.png"
  }
}
```

Replace the files in `public/` (`logo.svg`, `logo-dark.svg`, `favicon.svg`, `apple-touch-icon.png`) with your own assets to rebrand the UI instantly.

## API Endpoints

- `POST /upload-audio` - Upload audio file for transcription
- `POST /youtube-transcribe` - Transcribe YouTube video by URL
- `GET /download-pdf?session_id=...` - Download PDF of transcript/summary
- `GET /health` - Health check endpoint

### Request Overrides

Requests can override defaults via:
- `X-API-Key` header
- JSON fields: `apiKey`, `sttModel`, `summaryModel`, `summaryMaxTokens`
- Multipart form fields with same names

## Deployment

### Backend (Docker on VPS)

```bash
# Build Docker image
cd backend
docker build -t transcription-backend .

# Run container
docker run \
  --env-file .env \
  -p 8000:8000 \
  transcription-backend
```

### Frontend (Cloudflare Pages)

1. Connect your Git repository to Cloudflare Pages
2. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `pnpm install && pnpm build`
   - **Build output directory**: `.next`
3. Set environment variable:
   - `TRANSCRIPTION_API_URL` = Your backend URL

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
transcription-app/
├── app/                    # Next.js app router pages
│   ├── api/               # API route handlers
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── transcription-app.tsx
│   ├── file-upload.tsx
│   ├── youtube-input.tsx
│   └── transcript-display.tsx
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
├── backend/               # Python FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── models.py     # Pydantic models
│   │   └── services/     # Core services
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── public/               # Static assets
└── package.json
```

## Key Dependencies

### Frontend
- Next.js 15, React 19, TypeScript
- Tailwind CSS + shadcn/ui
- React Dropzone
- Radix UI primitives

### Backend
- FastAPI + Uvicorn
- OpenAI SDK
- yt-dlp (YouTube downloads)
- fpdf2 (PDF generation)
- python-multipart (file uploads)

## Development

### Frontend Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Backend Commands
```bash
uvicorn app.main:app --reload    # Dev server with hot reload
python -m pytest                 # Run tests (if configured)
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation in [DEPLOYMENT.md](./DEPLOYMENT.md) and [backend/README.md](./backend/README.md)
