from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple


@dataclass
class SessionRecord:
    transcript: str
    summary: str
    created_at: datetime
    expires_at: datetime


class SessionStore:
    """Simple in-memory session storage with expiration support."""

    def __init__(self, ttl_minutes: int = 120) -> None:
        self._ttl = timedelta(minutes=ttl_minutes)
        self._records: Dict[str, SessionRecord] = {}
        self._lock = threading.Lock()

    def create(self, transcript: str, summary: str) -> str:
        session_id = uuid.uuid4().hex
        now = datetime.now(timezone.utc)
        record = SessionRecord(
            transcript=transcript,
            summary=summary,
            created_at=now,
            expires_at=now + self._ttl,
        )
        with self._lock:
            self._records[session_id] = record
            self._purge_locked()
        return session_id

    def get(self, session_id: str) -> Optional[Tuple[str, str]]:
        with self._lock:
            record = self._records.get(session_id)
            if not record:
                return None
            if record.expires_at <= datetime.now(timezone.utc):
                del self._records[session_id]
                return None
            return record.transcript, record.summary

    def _purge_locked(self) -> None:
        """Remove expired sessions; caller must hold the lock."""
        now = datetime.now(timezone.utc)
        expired = [key for key, record in self._records.items() if record.expires_at <= now]
        for key in expired:
            del self._records[key]
