import { Lock, LogOut, RefreshCw } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { completeRequest, getStaffQueue, rejectRequest, SongRequest } from "../api/client";
import { QueueItem } from "../components/QueueItem";

const STAFF_PIN_KEY = "gym_song_request_staff_pin";

export function StaffDashboard() {
  const [staffPin, setStaffPin] = useState(() => sessionStorage.getItem(STAFF_PIN_KEY) ?? "");
  const [pinInput, setPinInput] = useState("");
  const [queue, setQueue] = useState<SongRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isUnlocked = staffPin.length > 0;

  async function loadQueue() {
    if (!staffPin) {
      setIsLoading(false);
      return;
    }

    try {
      setError("");
      setQueue(await getStaffQueue(staffPin));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the queue.");
      if (err instanceof Error && err.message.includes("Staff PIN")) {
        sessionStorage.removeItem(STAFF_PIN_KEY);
        setStaffPin("");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
    const intervalId = window.setInterval(loadQueue, 5000);
    return () => window.clearInterval(intervalId);
  }, [staffPin]);

  function handleUnlock(event: FormEvent) {
    event.preventDefault();
    const nextPin = pinInput.trim();
    if (!nextPin) {
      setError("Enter the staff PIN.");
      return;
    }
    sessionStorage.setItem(STAFF_PIN_KEY, nextPin);
    setStaffPin(nextPin);
    setPinInput("");
    setError("");
    setIsLoading(true);
  }

  function handleLogout() {
    sessionStorage.removeItem(STAFF_PIN_KEY);
    setStaffPin("");
    setQueue([]);
    setError("");
  }

  async function handleComplete(id: number) {
    setUpdatingId(id);
    try {
      await completeRequest(id, staffPin);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete request.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReject(id: number) {
    const reason = window.prompt("Reason for rejection? Leave blank if not needed.") ?? "";
    setUpdatingId(id);
    try {
      await rejectRequest(id, staffPin, reason.trim());
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject request.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!isUnlocked) {
    return (
      <section className="staff-layout staff-lock-layout">
        <form className="request-panel staff-lock-panel" onSubmit={handleUnlock}>
          <div className="lock-icon">
            <Lock size={24} />
          </div>
          <div>
            <p className="eyebrow">Staff only</p>
            <h1>Enter staff PIN</h1>
          </div>
          <label htmlFor="staff-pin">Staff PIN</label>
          <input
            id="staff-pin"
            className="pin-input"
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(event) => setPinInput(event.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button full-width" type="submit">
            <Lock size={18} />
            Open dashboard
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="staff-layout">
      <div className="section-header">
        <div>
          <p className="eyebrow">Staff dashboard</p>
          <h1>Pending queue</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={loadQueue}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button className="secondary-button" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Lock
          </button>
        </div>
      </div>

      <div className="queue-summary">
        <strong>{queue.length}</strong>
        <span>{queue.length === 1 ? "song waiting" : "songs waiting"}</span>
      </div>

      {error && <p className="error-text">{error}</p>}
      {isLoading ? (
        <p className="helper-text">Loading queue...</p>
      ) : queue.length === 0 ? (
        <div className="empty-state">
          <h2>No pending songs</h2>
          <p>The next request will appear here automatically.</p>
        </div>
      ) : (
        <div className="queue-list">
          {queue.map((request) => (
            <QueueItem
              key={request.id}
              request={request}
              isUpdating={updatingId === request.id}
              onComplete={handleComplete}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </section>
  );
}
