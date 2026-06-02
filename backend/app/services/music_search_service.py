from __future__ import annotations

import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.models.song_request import SongSuggestion


FALLBACK_SONGS = [
    SongSuggestion(song_title="Stronger", artist_name="Kanye West", album_name="Graduation"),
    SongSuggestion(song_title="Titanium", artist_name="David Guetta & Sia", album_name="Nothing but the Beat"),
    SongSuggestion(song_title="Lose Yourself", artist_name="Eminem", album_name="8 Mile"),
    SongSuggestion(song_title="Can't Hold Us", artist_name="Macklemore & Ryan Lewis", album_name="The Heist"),
    SongSuggestion(song_title="Remember the Name", artist_name="Fort Minor", album_name="The Rising Tied"),
    SongSuggestion(song_title="Power", artist_name="Kanye West", album_name="My Beautiful Dark Twisted Fantasy"),
]


def search_songs(query: str, limit: int = 8) -> list[SongSuggestion]:
    normalized_query = query.strip()
    if len(normalized_query) < 2:
        return []

    params = urlencode({"term": normalized_query, "entity": "song", "limit": limit})
    request = Request(
        f"https://itunes.apple.com/search?{params}",
        headers={"User-Agent": "fitness-center-song-request-app/1.0"},
    )

    try:
        with urlopen(request, timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
        results = []
        for item in payload.get("results", []):
            title = item.get("trackName")
            artist = item.get("artistName")
            if not title or not artist:
                continue
            results.append(
                SongSuggestion(
                    song_title=title,
                    artist_name=artist,
                    album_name=item.get("collectionName"),
                    spotify_track_id=str(item.get("trackId")) if item.get("trackId") else None,
                    album_image_url=item.get("artworkUrl100"),
                )
            )
        return results[:limit]
    except Exception:
        query_lower = normalized_query.lower()
        return [
            song
            for song in FALLBACK_SONGS
            if query_lower in song.song_title.lower() or query_lower in song.artist_name.lower()
        ][:limit]
