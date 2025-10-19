from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class TranscriptionResponse(BaseModel):
    session_id: str
    transcript: str
    summary: str


class YouTubeTranscriptionRequest(BaseModel):
    url: HttpUrl
    api_key: Optional[str] = Field(default=None, alias="apiKey")
    stt_model: Optional[str] = Field(default=None, alias="sttModel")
    summary_model: Optional[str] = Field(default=None, alias="summaryModel")
    summary_max_tokens: Optional[int] = Field(default=None, alias="summaryMaxTokens")

    class Config:
        populate_by_name = True


class TranscriptionOptions(BaseModel):
    api_key: Optional[str] = Field(default=None, alias="apiKey")
    stt_model: Optional[str] = Field(default=None, alias="sttModel")
    summary_model: Optional[str] = Field(default=None, alias="summaryModel")
    summary_max_tokens: Optional[int] = Field(default=None, alias="summaryMaxTokens")

    class Config:
        populate_by_name = True

class ErrorResponse(BaseModel):
    detail: str
