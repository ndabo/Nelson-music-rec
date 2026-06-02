from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_database
from app.routes import requests, songs


app = FastAPI(title="Fitness Center Song Request API")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Allow the Vercel deployment URL (set FRONTEND_URL env var in Vercel dashboard)
import os

_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    ALLOWED_ORIGINS.append(_frontend_url)

# Also allow same-origin requests on Vercel (API is served from the same domain)
_vercel_url = os.getenv("VERCEL_URL")
if _vercel_url:
    ALLOWED_ORIGINS.append(f"https://{_vercel_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    init_database()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(songs.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
