from __future__ import annotations

from datetime import date, datetime, timezone
import os
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.database import get_connection, is_postgres, placeholder, placeholders
from app.models.song_request import (
    RejectRequestBody,
    RequestLimitInfo,
    SongRequest,
    SongRequestCreate,
    SongRequestResponse,
)
from app.services.request_limit_service import (
    DAILY_REQUEST_LIMIT,
    count_requests_today,
    hash_ip,
)


router = APIRouter(tags=["requests"])
STAFF_PIN = os.getenv("STAFF_PIN", "1234")


def parse_datetime(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


def row_to_song_request(row) -> SongRequest:
    return SongRequest(
        id=row["id"],
        song_title=row["song_title"],
        artist_name=row["artist_name"],
        album_name=row["album_name"],
        spotify_track_id=row["spotify_track_id"],
        album_image_url=row["album_image_url"],
        requested_at=parse_datetime(row["requested_at"]),
        status=row["status"],
        completed_at=parse_datetime(row["completed_at"]),
        rejected_at=parse_datetime(row["rejected_at"]),
        rejection_reason=row["rejection_reason"],
        request_date=str(row["request_date"]),
    )


def verify_staff_pin(x_staff_pin: Annotated[str | None, Header(alias="X-Staff-Pin")] = None) -> None:
    if x_staff_pin != STAFF_PIN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff PIN required.")


def pending_duplicate_exists(
    connection, song_title: str, artist_name: str, track_id: str | None
) -> bool:
    """Single-query duplicate check against an already-open connection.
    Matches on Spotify track id (if present) OR on title+artist."""
    normalized_title = song_title.strip().lower()
    normalized_artist = artist_name.strip().lower()
    param = placeholder()

    conditions = [f"(LOWER(TRIM(song_title)) = {param} AND LOWER(TRIM(artist_name)) = {param})"]
    params: list = [normalized_title, normalized_artist]
    if track_id:
        conditions.insert(0, f"spotify_track_id = {param}")
        params.insert(0, track_id)

    row = connection.execute(
        f"""
        SELECT id
        FROM song_requests
        WHERE status = 'pending'
          AND ({" OR ".join(conditions)})
        LIMIT 1
        """,
        tuple(params),
    ).fetchone()
    return row is not None


@router.get("/request-limit/{user_device_id}", response_model=RequestLimitInfo)
def get_request_limit(user_device_id: str) -> RequestLimitInfo:
    used = count_requests_today(user_device_id)
    return RequestLimitInfo(
        daily_limit=DAILY_REQUEST_LIMIT,
        used_today=used,
        remaining_today=max(DAILY_REQUEST_LIMIT - used, 0),
    )


@router.post("/requests", response_model=SongRequestResponse, status_code=status.HTTP_201_CREATED)
def create_song_request(payload: SongRequestCreate, request: Request) -> SongRequestResponse:
    requested_at = datetime.now(timezone.utc)
    request_date = date.today().isoformat()
    user_ip_hash = hash_ip(request.client.host if request.client else None)
    postgres = is_postgres()
    returning_clause = " RETURNING *" if postgres else ""

    # One connection / one transaction for the whole request: duplicate check,
    # daily-limit check, and insert. Avoids opening four separate Postgres
    # connections (each a TCP+TLS handshake) and makes the checks atomic.
    with get_connection() as connection:
        if pending_duplicate_exists(
            connection, payload.song_title, payload.artist_name, payload.spotify_track_id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This song is already in the staff queue.",
            )

        used_today = count_requests_today(
            payload.user_device_id, connection=connection
        )
        if used_today >= DAILY_REQUEST_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily request limit reached ({DAILY_REQUEST_LIMIT} songs).",
            )

        cursor = connection.execute(
            f"""
            INSERT INTO song_requests (
                song_title,
                artist_name,
                album_name,
                spotify_track_id,
                album_image_url,
                requested_at,
                status,
                user_device_id,
                user_ip_hash,
                request_date
            )
            VALUES ({placeholders(6)}, 'pending', {placeholders(3)})
            {returning_clause}
            """,
            (
                payload.song_title,
                payload.artist_name,
                payload.album_name,
                payload.spotify_track_id,
                payload.album_image_url,
                requested_at.isoformat(),
                payload.user_device_id,
                user_ip_hash,
                request_date,
            ),
        )
        if postgres:
            row = cursor.fetchone()
        else:
            row = connection.execute(
                f"SELECT * FROM song_requests WHERE id = {placeholder()}",
                (cursor.lastrowid,),
            ).fetchone()

    # We just added one row, so remaining is known without another query.
    remaining = max(DAILY_REQUEST_LIMIT - (used_today + 1), 0)
    return SongRequestResponse(
        request=row_to_song_request(row),
        remaining_requests_today=remaining,
    )


@router.get("/staff/queue", response_model=list[SongRequest])
def get_staff_queue(staff_pin: Annotated[str | None, Header(alias="X-Staff-Pin")] = None) -> list[SongRequest]:
    verify_staff_pin(staff_pin)
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM song_requests
            WHERE status = 'pending'
            ORDER BY requested_at ASC
            """
        ).fetchall()
    return [row_to_song_request(row) for row in rows]


@router.patch("/staff/requests/{request_id}/complete", response_model=SongRequest)
def complete_song_request(
    request_id: int,
    staff_pin: Annotated[str | None, Header(alias="X-Staff-Pin")] = None,
) -> SongRequest:
    verify_staff_pin(staff_pin)
    completed_at = datetime.now(timezone.utc).isoformat()
    param = placeholder()
    with get_connection() as connection:
        connection.execute(
            f"""
            UPDATE song_requests
            SET status = 'completed',
                completed_at = {param},
                rejected_at = NULL,
                rejection_reason = NULL
            WHERE id = {param} AND status = 'pending'
            """,
            (completed_at, request_id),
        )
        row = connection.execute(f"SELECT * FROM song_requests WHERE id = {param}", (request_id,)).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    if row["status"] != "completed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request is no longer pending.")
    return row_to_song_request(row)


@router.patch("/staff/requests/{request_id}/reject", response_model=SongRequest)
def reject_song_request(
    request_id: int,
    payload: RejectRequestBody,
    staff_pin: Annotated[str | None, Header(alias="X-Staff-Pin")] = None,
) -> SongRequest:
    verify_staff_pin(staff_pin)
    rejected_at = datetime.now(timezone.utc).isoformat()
    param = placeholder()
    with get_connection() as connection:
        connection.execute(
            f"""
            UPDATE song_requests
            SET status = 'rejected',
                rejected_at = {param},
                rejection_reason = {param}
            WHERE id = {param} AND status = 'pending'
            """,
            (rejected_at, payload.reason, request_id),
        )
        row = connection.execute(f"SELECT * FROM song_requests WHERE id = {param}", (request_id,)).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    if row["status"] != "rejected":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request is no longer pending.")
    return row_to_song_request(row)
