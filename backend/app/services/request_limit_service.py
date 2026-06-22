from __future__ import annotations

import hashlib
from datetime import date
from typing import Any

from app.database import get_connection, placeholder


DAILY_REQUEST_LIMIT = 3


def hash_ip(ip_address: str | None) -> str | None:
    if not ip_address:
        return None
    return hashlib.sha256(ip_address.encode("utf-8")).hexdigest()


def count_requests_today(
    user_device_id: str,
    request_date: date | None = None,
    connection: Any | None = None,
) -> int:
    """Count today's requests for a device. Pass an open ``connection`` to
    reuse it (avoids opening a fresh Postgres connection per call)."""
    day = (request_date or date.today()).isoformat()
    param = placeholder()
    sql = f"""
        SELECT COUNT(*) AS count
        FROM song_requests
        WHERE user_device_id = {param}
          AND request_date = {param}
          AND status IN ('pending', 'completed')
    """
    params = (user_device_id, day)
    if connection is not None:
        row = connection.execute(sql, params).fetchone()
        return int(row["count"])
    with get_connection() as own_connection:
        row = own_connection.execute(sql, params).fetchone()
    return int(row["count"])


def remaining_requests_today(user_device_id: str) -> int:
    return max(DAILY_REQUEST_LIMIT - count_requests_today(user_device_id), 0)
