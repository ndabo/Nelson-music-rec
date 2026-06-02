from fastapi import APIRouter, Query

from app.models.song_request import SongSuggestion
from app.services.music_search_service import search_songs


router = APIRouter(tags=["songs"])


@router.get("/search-songs", response_model=list[SongSuggestion])
def search_song_suggestions(q: str = Query(min_length=2, max_length=80)) -> list[SongSuggestion]:
    return search_songs(q)
