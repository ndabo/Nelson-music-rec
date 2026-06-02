# Fitness Center Song Request App

MVP song request queue for a gym. Members scan a QR code, request songs, and staff manage a FIFO queue.

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

Staff routes require a PIN. For local development the default is `1234`; set `STAFF_PIN` before starting the backend to change it:

```bash
STAFF_PIN=2468 uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

Member requests go to `/request`. Staff can open `/staff` and enter the staff PIN to see and manage the queue.

## Database

Local data is stored in SQLite at `backend/data/song_requests.db`.

Open the database shell:

```bash
sqlite3 backend/data/song_requests.db
```

Useful SQLite commands:

```sql
.tables
.schema song_requests
.headers on
.mode column
SELECT id, song_title, artist_name, status, requested_at FROM song_requests ORDER BY requested_at DESC;
SELECT id, song_title, artist_name, status FROM song_requests WHERE status = 'pending' ORDER BY requested_at ASC;
.quit
```

You can also open `backend/data/song_requests.db` with a desktop SQLite viewer such as DB Browser for SQLite.

### Supabase Postgres

The backend uses SQLite when `DATABASE_URL` is not set. To use Supabase, set `DATABASE_URL` to your Supabase Postgres connection string before starting the backend.

1. In Supabase, open your project.
2. Click **Connect**.
3. Copy the **Session pooler** connection string for a hosted backend, or the direct connection string if your environment supports IPv6.
4. Replace `[YOUR-PASSWORD]` with your database password.
5. Save the connection string in `backend/.env`:

```bash
DATABASE_URL='postgres://postgres.your-project-ref:YOUR-PASSWORD@aws-0-your-region.pooler.supabase.com:5432/postgres'
STAFF_PIN=1234
```

6. Start the backend:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

The app creates the `song_requests` table automatically on startup.

For Render, add `DATABASE_URL` as an environment variable on the backend service. Keep the value secret; do not commit it.

## CI/CD

GitHub Actions workflows live in `.github/workflows`.

- `ci.yml` runs on pushes and pull requests. It checks the backend can compile/import and builds the frontend.
- `deploy.yml` is ready for Vercel frontend deploys and Render backend deploys, but is disabled until deployment secrets are configured.

To enable deploys:

1. In GitHub, open repo Settings -> Secrets and variables -> Actions.
2. Add repository variable `ENABLE_DEPLOY` with value `true`.
3. Add secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.
4. Add secret `RENDER_DEPLOY_HOOK_URL` from your Render service deploy hook.

Render backend start command:

```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
