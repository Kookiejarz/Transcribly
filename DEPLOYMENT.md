# Deployment Guide

This document walks through deploying the Transcribly frontend to Cloudflare Pages and the FastAPI backend to a VPS using Docker.

## 1. Backend (FastAPI) on VPS

1. **Clone and prepare**
   ```bash
   git clone <repo-url>
   cd transcription-app/backend
   cp .env.example .env
   # edit .env and set OPENAI_API_KEY plus any overrides
   ```

2. **Build the Docker image**
   ```bash
   docker build -t transcription-backend .
   ```

3. **Run the container**
   ```bash
   docker run \
     --env-file .env \
     -p 8000:8000 \
     --name transcription-backend \
     -d \
     transcription-backend
   ```

4. **Expose the service**
   - Ensure port `8000` is open on the VPS firewall.
   - Optionally configure a reverse proxy (nginx/Caddy) with HTTPS and forward traffic to `localhost:8000`.

5. **Testing**
   ```bash
   curl http://<your-domain-or-ip>:8000/health
   ```

The backend expects the following at runtime:
- `OPENAI_API_KEY` (required unless provided per request)
- Optional model overrides (`STT_MODEL_NAME`, `SUMMARY_MODEL_NAME`, etc.)

## 2. Frontend (Next.js) on Cloudflare Pages

1. **Push the repository** to GitHub/GitLab and connect the project in Cloudflare Pages.

2. **Configure build settings**
   - **Framework preset:** Next.js
   - **Build command:** `pnpm install && pnpm run build`
   - **Build output directory:** `.next`
   - **Node version:** use the default or set to `18.x`
   - **Package manager:** ensure `PNPM_VERSION` (e.g. `9`) is set if you rely on a specific version.

   The `pnpm run build` script automatically prunes `.next/cache` after compiling so the artifacts stay under Cloudflare’s 25 MiB per-file limit. The project also ships with a `.cfignore` that excludes backend and cache directories from the upload bundle. Pages Functions under `functions/api/*` are deployed automatically and proxy `/api` traffic to your backend.
3. **Set environment variables (Project Settings → Environment Variables)**
   - `NEXT_PUBLIC_DEFAULT_OPENAI_STT_MODEL` (optional, default `gpt-4o-transcription`)
   - `NEXT_PUBLIC_DEFAULT_ASSEMBLY_MODEL` (optional, default `universal`)
   - `NEXT_PUBLIC_DEFAULT_SUMMARY_MODEL` (optional, default `gpt-4o-mini`)
   - `NEXT_PUBLIC_DEFAULT_SUMMARY_MAX_TOKENS` (optional, default `350`)
   - `BACKEND_ORIGIN` **(required)** – base URL of the FastAPI backend, e.g. `https://api.yourdomain.com`
   - `NEXT_PUBLIC_TRANSCRIPTION_API_URL` (optional) – only set if you prefer the frontend to call the backend directly instead of the Cloudflare proxy

   If you want the frontend to forward a default API key with every request, add a public env such as `NEXT_PUBLIC_DEFAULT_API_KEY` and wire it into the UI. The current UI already allows end users to input their key locally, so server-side storage is optional.

4. **Trigger a deployment** by committing changes or manually rebuilding in Cloudflare Pages.

5. **Verify**
   - Visit the Cloudflare Pages URL.
   - Upload an audio file and run a YouTube transcription to confirm the frontend successfully reaches the backend.

### Local development

When running `pnpm dev`, create a `.env.local` file with `NEXT_PUBLIC_TRANSCRIPTION_API_URL=http://localhost:8000` so the client can talk directly to your locally running FastAPI backend.

## 3. Keeping Things Updated

- Whenever backend code changes, rebuild and redeploy the Docker container on the VPS.
- For frontend updates, push to your main branch; Cloudflare Pages will rebuild automatically.
- Rotate the OpenAI API key by updating the backend `.env` file and restarting the container.
