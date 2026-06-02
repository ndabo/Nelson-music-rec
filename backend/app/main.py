import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_database
from app.routes import requests, songs


app = FastAPI(title="Fitness Center Song Request API")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    ALLOWED_ORIGINS.append(_frontend_url)

_vercel_url = os.getenv("VERCEL_URL")
if _vercel_url:
    ALLOWED_ORIGINS.append(f"https://{_vercel_url}")

# On Vercel, allow all origins since frontend and API share the same domain
if os.getenv("VERCEL"):
    ALLOWED_ORIGINS.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database — wrapped in try/except so the app still starts if DB is temporarily unavailable
try:
    init_database()
except Exception as e:
    import sys
    print(f"WARNING: Database init failed: {e}", file=sys.stderr)


@app.get("/api/health")
def health() -> dict[str, str]:
    from app.database import get_database_url
    has_db = bool(get_database_url())
    return {"status": "ok", "database": "postgres" if has_db else "none"}


app.include_router(songs.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
