from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


RequestStatus = Literal["pending", "completed", "rejected"]


class SongSuggestion(BaseModel):
    song_title: str
    artist_name: str
    album_name: str | None = None
    spotify_track_id: str | None = None
    album_image_url: str | None = None


class SongRequestCreate(SongSuggestion):
    user_device_id: str = Field(min_length=8, max_length=128)


class SongRequest(SongSuggestion):
    id: int
    requested_at: datetime
    status: RequestStatus
    completed_at: datetime | None = None
    rejected_at: datetime | None = None
    rejection_reason: str | None = None
    request_date: str


class SongRequestResponse(BaseModel):
    request: SongRequest
    remaining_requests_today: int


class RejectRequestBody(BaseModel):
    reason: str | None = Field(default=None, max_length=240)


class RequestLimitInfo(BaseModel):
    daily_limit: int
    used_today: int
    remaining_today: int
