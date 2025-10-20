# Transcribly - Audio/Video Transcription & Summarization App

A web application that transcribes and summarizes audio/video content using OpenAI or AssemblyAI. Users can upload audio files or provide YouTube URLs to get AI-generated transcripts and summaries with plain text export.

## Features

- 🎙️ **Audio Transcription** - Upload MP3, WAV, MP4, or M4A files
- 🎬 **YouTube Support** - Transcribe videos directly from YouTube URLs
- 📝 **AI Summarization** - Generate concise summaries with chunking for long transcripts
- 🔄 **Provider Switch** - Toggle between OpenAI Whisper and AssemblyAI
- 🎚️ **Model Picker** - Choose transcription models per provider (Whisper-1, GPT-4o Transcription, Universal, Slam-1)
- 📄 **Text Export** - Download transcripts and summaries as plain text files
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
  - Provider switch between OpenAI Whisper and AssemblyAI
  - Model picker per provider (Whisper-1, GPT-4o Transcription, Universal, Slam-1)
  - Copy to clipboard & text download
  - Configurable API settings

### Backend (FastAPI + Python)
- **Framework**: FastAPI with async support
- **Core Services**:
  - OpenAI Whisper API integration
  - AssemblyAI transcription integration with speech model selection
  - Text summarization with smart chunking
  - YouTube audio extraction via `yt-dlp`
  - Plain text transcript export
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
| `OPENAI_API_KEY` | OpenAI API key (required unless provided per-request) | - |
| `OPENAI_API_BASE` | Custom API base for compatible endpoints | - |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key (required when using AssemblyAI) | - |
| `TRANSCRIPTION_PROVIDER` | Default provider: `openai` or `assemblyai` | `openai` |
| `STT_MODEL_NAME` | OpenAI speech-to-text model | `gpt-4o-transcription` |
| `ASSEMBLYAI_SPEECH_MODEL` | AssemblyAI speech model | `universal` |
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
NEXT_PUBLIC_DEFAULT_OPENAI_STT_MODEL=gpt-4o-transcription
NEXT_PUBLIC_DEFAULT_ASSEMBLY_MODEL=universal
NEXT_PUBLIC_DEFAULT_SUMMARY_MODEL=gpt-4o-mini
NEXT_PUBLIC_DEFAULT_SUMMARY_MAX_TOKENS=300
NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_PROVIDER=openai
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
- `GET /download-transcript?session_id=...` - Download transcript/summary as plain text
- `GET /health` - Health check endpoint

### Request Overrides

Requests can override defaults via:
- `X-API-Key` header
- `X-AssemblyAI-Key` header (AssemblyAI provider)
- JSON fields: `apiKey`, `assemblyApiKey`, `assemblyModel`, `sttModel`, `summaryModel`, `summaryMaxTokens`, `provider`
- Multipart form fields with the same names

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
