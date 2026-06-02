const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type SongSuggestion = {
  song_title: string;
  artist_name: string;
  album_name?: string | null;
  spotify_track_id?: string | null;
  album_image_url?: string | null;
};

export type SongRequest = SongSuggestion & {
  id: number;
  requested_at: string;
  status: "pending" | "completed" | "rejected";
  completed_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  request_date: string;
};

export type RequestLimitInfo = {
  daily_limit: number;
  used_today: number;
  remaining_today: number;
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function searchSongs(query: string) {
  return apiFetch<SongSuggestion[]>(`/api/search-songs?q=${encodeURIComponent(query)}`);
}

export function getRequestLimit(deviceId: string) {
  return apiFetch<RequestLimitInfo>(`/api/request-limit/${encodeURIComponent(deviceId)}`);
}

export function submitSongRequest(song: SongSuggestion, userDeviceId: string) {
  return apiFetch<{ request: SongRequest; remaining_requests_today: number }>("/api/requests", {
    method: "POST",
    body: JSON.stringify({ ...song, user_device_id: userDeviceId }),
  });
}

function staffHeaders(staffPin: string) {
  return { "X-Staff-Pin": staffPin };
}

export function getStaffQueue(staffPin: string) {
  return apiFetch<SongRequest[]>("/api/staff/queue", {
    headers: staffHeaders(staffPin),
  });
}

export function completeRequest(id: number, staffPin: string) {
  return apiFetch<SongRequest>(`/api/staff/requests/${id}/complete`, {
    method: "PATCH",
    headers: staffHeaders(staffPin),
  });
}

export function rejectRequest(id: number, staffPin: string, reason?: string) {
  return apiFetch<SongRequest>(`/api/staff/requests/${id}/reject`, {
    method: "PATCH",
    headers: staffHeaders(staffPin),
    body: JSON.stringify({ reason: reason || null }),
  });
}
