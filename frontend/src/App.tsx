import { Dumbbell, Headphones } from "lucide-react";
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
        <a className="brand" href="/request" aria-label="Gym song requests">
          <Dumbbell size={24} />
          <span>Gym Song Requests</span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className={route === "request" ? "active" : ""} href="/request">
            <Headphones size={18} />
            Request
          </a>
        </nav>
      </header>

      <main>{route === "staff" ? <StaffDashboard /> : <RequestPage />}</main>
    </div>
  );
}
