import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { searchSongs, SongSuggestion } from "../api/client";

type Props = {
  selectedSong: SongSuggestion | null;
  onSelect: (song: SongSuggestion | null) => void;
};

export function SongSearchBox({ selectedSong, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const canSearch = useMemo(() => query.trim().length >= 2, [query]);

  useEffect(() => {
    if (!canSearch || selectedSong) {
      setResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setError("");
      try {
        setResults(await searchSongs(query.trim()));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Song search failed.");
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [canSearch, query, selectedSong]);

  if (selectedSong) {
    return (
      <div className="selected-song">
        {selectedSong.album_image_url ? (
          <img src={selectedSong.album_image_url} alt="" />
        ) : (
          <div className="album-placeholder">♪</div>
        )}
        <div>
          <strong>{selectedSong.song_title}</strong>
          <span>{selectedSong.artist_name}</span>
        </div>
        <button className="icon-button" type="button" onClick={() => onSelect(null)} aria-label="Clear song">
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="song-search">
      <label htmlFor="song-search">Search for a song</label>
      <div className="search-input">
        <Search size={20} />
        <input
          id="song-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Song title or artist"
          autoComplete="off"
        />
      </div>
      {isSearching && <p className="helper-text">Searching...</p>}
      {error && <p className="error-text">{error}</p>}
      {results.length > 0 && (
        <ul className="suggestions">
          {results.map((song) => (
            <li key={`${song.spotify_track_id}-${song.song_title}-${song.artist_name}`}>
              <button type="button" onClick={() => onSelect(song)}>
                {song.album_image_url ? <img src={song.album_image_url} alt="" /> : <span className="album-placeholder">♪</span>}
                <span>
                  <strong>{song.song_title}</strong>
                  <small>{song.artist_name}{song.album_name ? ` · ${song.album_name}` : ""}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
