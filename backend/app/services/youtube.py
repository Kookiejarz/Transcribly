from __future__ import annotations

import asyncio
import tempfile
from pathlib import Path
from typing import Optional

try:
    import yt_dlp
except ImportError as exc:  # pragma: no cover - optional dependency
    raise RuntimeError(
        "YouTube audio support requires the `yt-dlp` package. "
        "Install it with `pip install yt-dlp`."
    ) from exc


class YouTubeAudioService:
    """Downloads audio tracks from YouTube URLs for transcription."""

    def __init__(self, output_dir: Optional[str], fmt: str = "bestaudio/best") -> None:
        self._format = fmt
        self._base_dir = Path(output_dir) if output_dir else Path(tempfile.gettempdir())

    async def download_audio(self, url: str) -> Path:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._download_blocking, url)

    def _download_blocking(self, url: str) -> Path:
        temp_dir = Path(tempfile.mkdtemp(dir=self._base_dir))
        output_template = str(temp_dir / "%(id)s.%(ext)s")
        ydl_opts = {
            "format": self._format,
            "outtmpl": output_template,
            "quiet": True,
            "nocheckcertificate": True,
            "noplaylist": True,
            "ignoreerrors": False,
            "cachedir": False,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if not info:
                raise ValueError("Failed to download audio from the provided URL.")
            downloaded_path = ydl.prepare_filename(info)

        mp3_path = Path(downloaded_path).with_suffix(".mp3")
        if mp3_path.exists():
            return mp3_path
        final_path = Path(downloaded_path)
        if final_path.exists():
            return final_path
        raise FileNotFoundError("Audio download completed but file was not found.")

    async def cleanup_path(self, path: Path) -> None:
        await asyncio.to_thread(self._cleanup_blocking, path)

    def _cleanup_blocking(self, path: Path) -> None:
        if not path:
            return
        directory = path.parent if path.exists() else path
        if directory.exists():
            for child in directory.iterdir():
                try:
                    child.unlink()
                except IsADirectoryError:
                    self._cleanup_blocking(child)
            try:
                directory.rmdir()
            except OSError:
                pass
