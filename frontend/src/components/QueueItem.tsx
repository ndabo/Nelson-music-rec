import { Check, X } from "lucide-react";
import { SongRequest } from "../api/client";

type Props = {
  request: SongRequest;
  onComplete: (id: number) => void;
  onReject: (id: number) => void;
  isUpdating: boolean;
};

export function QueueItem({ request, onComplete, onReject, isUpdating }: Props) {
  const requestedAt = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(request.requested_at));

  return (
    <article className="queue-item">
      {request.album_image_url ? <img src={request.album_image_url} alt="" /> : <div className="album-placeholder">♪</div>}
      <div className="queue-song">
        <strong>{request.song_title}</strong>
        <span>{request.artist_name}</span>
        <small>{requestedAt}{request.album_name ? ` · ${request.album_name}` : ""}</small>
      </div>
      <div className="queue-actions">
        <button className="secondary-button" type="button" onClick={() => onReject(request.id)} disabled={isUpdating}>
          <X size={18} />
          Reject
        </button>
        <button className="primary-button" type="button" onClick={() => onComplete(request.id)} disabled={isUpdating}>
          <Check size={18} />
          Complete
        </button>
      </div>
    </article>
  );
}
