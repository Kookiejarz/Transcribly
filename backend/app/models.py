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
    assembly_api_key: Optional[str] = Field(default=None, alias="assemblyApiKey")
    assembly_model: Optional[str] = Field(default=None, alias="assemblyModel")
    stt_model: Optional[str] = Field(default=None, alias="sttModel")
    summary_model: Optional[str] = Field(default=None, alias="summaryModel")
    summary_max_tokens: Optional[int] = Field(default=None, alias="summaryMaxTokens")
    provider: Optional[str] = Field(default=None, alias="provider")

    class Config:
        populate_by_name = True


class TranscriptionOptions(BaseModel):
    api_key: Optional[str] = Field(default=None, alias="apiKey")
    assembly_api_key: Optional[str] = Field(default=None, alias="assemblyApiKey")
    assembly_model: Optional[str] = Field(default=None, alias="assemblyModel")
    stt_model: Optional[str] = Field(default=None, alias="sttModel")
    summary_model: Optional[str] = Field(default=None, alias="summaryModel")
    summary_max_tokens: Optional[int] = Field(default=None, alias="summaryMaxTokens")
    provider: Optional[str] = Field(default=None, alias="provider")

    class Config:
        populate_by_name = True


class TranscriptionRequest(BaseModel):
    api_key: Optional[str] = Field(None, alias="apiKey")
    assembly_api_key: Optional[str] = Field(None, alias="assemblyApiKey")
    assembly_model: Optional[str] = Field(None, alias="assemblyModel")
    stt_model: Optional[str] = Field(None, alias="sttModel")
    summary_model: Optional[str] = Field(None, alias="summaryModel")
    summary_max_tokens: Optional[int] = Field(None, alias="summaryMaxTokens")
    provider: Optional[str] = Field(None, alias="provider")  # "openai" or "assemblyai"


class ErrorResponse(BaseModel):
    detail: str
