import { RequestPage } from "./pages/RequestPage";
import { StaffDashboard } from "./pages/StaffDashboard";

type Route = "request" | "staff";

function getRoute(): Route {
  return window.location.pathname.startsWith("/staff") ? "staff" : "request";
}

export function App() {
  const route = getRoute();

  return (
    <div className="app-shell">
      <header className="top-bar">
        {/* Wordmark only — the staff portal is never surfaced in the member UI.
            /staff is reachable by direct URL + PIN. */}
        <a className="brand" href="/request" aria-label="Nelson Fitness">
          <span className="wordmark">
            Nelson<span className="wordmark-dot">.</span>
          </span>
          <span className="wordmark-sub">Fitness</span>
        </a>
      </header>

      <main>{route === "staff" ? <StaffDashboard /> : <RequestPage />}</main>
    </div>
  );
}
