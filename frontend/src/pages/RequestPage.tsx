import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { getRequestLimit, RequestLimitInfo, SongSuggestion, submitSongRequest } from "../api/client";
import { SongSearchBox } from "../components/SongSearchBox";
import { getDeviceId } from "../utils/device";

export function RequestPage() {
  const [deviceId] = useState(getDeviceId);
  const [selectedSong, setSelectedSong] = useState<SongSuggestion | null>(null);
  const [limitInfo, setLimitInfo] = useState<RequestLimitInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getRequestLimit(deviceId).then(setLimitInfo).catch(() => {
      setLimitInfo({ daily_limit: 3, used_today: 0, remaining_today: 3 });
    });
  }, [deviceId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSong) {
      setError("Choose a song from the list first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await submitSongRequest(selectedSong, deviceId);
      setLimitInfo((current) => ({
        daily_limit: current?.daily_limit ?? 3,
        used_today: Math.max((current?.daily_limit ?? 3) - response.remaining_requests_today, 0),
        remaining_today: response.remaining_requests_today,
      }));
      setSelectedSong(null);
      setMessage(`${response.request.song_title} was added to the staff queue.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const remaining = limitInfo?.remaining_today ?? 0;
  const isLimitReached = limitInfo !== null && remaining <= 0;

  return (
    <section className="request-layout">
      <div className="request-copy">
        <p className="eyebrow">Fitness center playlist</p>
        <h1>Ask us to play a song</h1>
        <p>Pick one track for the staff queue. Requests play in the order they arrive.</p>
      </div>

      <form className="request-panel" onSubmit={handleSubmit}>
        <div className="limit-row">
          <span>Daily limit</span>
          <strong>
            {remaining} of {limitInfo?.daily_limit ?? 3} left
          </strong>
        </div>

        <SongSearchBox selectedSong={selectedSong} onSelect={(song) => {
          setSelectedSong(song);
          setError("");
          setMessage("");
        }} />

        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        <button className="primary-button full-width" type="submit" disabled={!selectedSong || isSubmitting || isLimitReached}>
          <Send size={18} />
          {isLimitReached ? "Limit reached today" : isSubmitting ? "Sending..." : "Submit request"}
        </button>
      </form>
    </section>
  );
}
