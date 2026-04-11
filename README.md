# Blend Colour Game — ECE 493

A real-time multiplayer colour-blending game. Players mix a set of base colours to match a randomly generated target colour as closely as possible. Scores are based on Euclidean colour distance. Supports guest play, OAuth sign-in, single-player, and multiplayer rooms with live WebSocket sync.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/Abdullahs1214/ECE493proj.git
cd ECE493proj
git checkout dev
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create your .env file from the example
cp .env.example .env

# Apply database migrations
python manage.py migrate

# Install wsproto support for realtime WebSocket handling
pip install wsproto

# Start the backend server
uvicorn blend_colour_game.asgi:application --reload --ws wsproto
```

Backend runs at **http://localhost:8000**

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

Open **http://localhost:5173** in your browser and click **Continue as guest** to start playing immediately.

---

## Environment Variables

The `.env` file is created from `.env.example`. The defaults work for local development — no changes needed for guest play.

| Variable | Default | Notes |
|----------|---------|-------|
| `DJANGO_SECRET_KEY` | `replace-me` | Change for any non-local deployment |
| `DJANGO_DEBUG` | `true` | Set to `false` in production |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | |
| `DJANGO_CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Must match frontend URL |
| `FRONTEND_BASE_URL` | `http://localhost:5173` | Used for OAuth redirects |
| `GOOGLE_OAUTH_CLIENT_ID` | *(empty)* | Optional — see OAuth section below |
| `GOOGLE_OAUTH_CLIENT_SECRET` | *(empty)* | Optional |
| `GITHUB_OAUTH_CLIENT_ID` | *(empty)* | Optional |
| `GITHUB_OAUTH_CLIENT_SECRET` | *(empty)* | Optional |

---

## OAuth Sign-In (Optional)

Guest play works out of the box. OAuth sign-in (Google / GitHub) requires additional setup:

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add `http://127.0.0.1:8000/auth/oauth/complete/?provider=google` as an authorised redirect URI
4. Copy the client ID and secret into `.env`:
   ```
   GOOGLE_OAUTH_CLIENT_ID=your-client-id
   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
   ```

### GitHub

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Set **Authorization callback URL** to `http://127.0.0.1:8000/auth/oauth/complete/?provider=github`
3. Copy the client ID and secret into `.env`:
   ```
   GITHUB_OAUTH_CLIENT_ID=your-client-id
   GITHUB_OAUTH_CLIENT_SECRET=your-client-secret
   ```

> **Note**: OAuth providers require HTTPS for production deployments. For localhost, use `http://127.0.0.1` (not `http://localhost`) as configured in `.env.example`.

---

## Multiplayer

1. Both players open **http://localhost:5173** (can use the same machine in different tabs)
2. Both sign in as guests (or with OAuth)
3. Player A clicks **Multiplayer** → **Create room** — share the room code shown
4. Player B clicks **Multiplayer** → pastes the room code → **Join**
5. Player A (host) clicks **Start game** once both players are in the lobby
6. After 3 rounds, click **Back to Lobby** to play again in the same room

---

## Development Commands

### Backend

```bash
cd backend
source .venv/bin/activate

python manage.py migrate          # apply migrations
pip install wsproto              # install wsproto support
uvicorn blend_colour_game.asgi:application --reload --ws wsproto  # start dev server

ruff check .                      # lint
```

### Frontend

```bash
cd frontend

npm install
npm run dev       # start dev server
npm run build     # production build
npm run test      # run unit tests
npm run coverage  # test coverage report
```

---

## Testing Instructions

### Backend tests and coverage

In a fresh clone, the backend test suite requires runtime dependencies, test dependencies, and Django environment variables.

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

pip install -r requirements.txt
pip install pytest pytest-django coverage ruff wsproto

export PYTHONPATH=$(pwd)
export DJANGO_SETTINGS_MODULE=blend_colour_game.settings

python manage.py migrate

pytest tests

coverage erase
coverage run --branch --source=api,apps,engine,services,websockets -m pytest tests
coverage report -m --omit="*/migrations/*,*/tests/*,*/__init__.py,*/apps.py,blend_colour_game/settings.py,blend_colour_game/urls.py"
```

### Frontend tests and coverage

```bash
cd frontend
npm install
npm test
npm run coverage
```

---

## Project Structure

```
ECE493proj/
├── backend/
│   ├── apps/
│   │   ├── accounts/     # PlayerIdentity, Session models
│   │   ├── gameplay/     # Match, Round, Submission, ScoreRecord models
│   │   └── rooms/        # Room, RoomMembership models
│   ├── engine/           # Round and scoring logic
│   ├── services/         # Business logic (match, room, social, history)
│   ├── api/              # HTTP API views and URL routing
│   └── websockets/       # WebSocket consumer and real-time broker
├── frontend/
│   ├── src/
│   │   ├── components/   # Presentational components
│   │   ├── containers/   # Stateful containers
│   │   ├── hooks/        # useGameplayState, useRoomState, useSessionState
│   │   ├── services/     # apiClient, realtimeClient
│   │   └── types/        # TypeScript types
│   └── tests/
└── specs/project/        # Specification, planning artifacts, contracts
```

---

## Gameplay Overview

- Players are given a **target colour** and a set of **8 base colours** (White, Black, Red, Green, Blue, Cyan, Magenta, Yellow)
- Each player blends the base colours by assigning mix weights using the tile controls
- At the end of each round, submissions are scored by **Euclidean colour distance** to the target
- Similarity percentage and a 0–1000 score are calculated; players are ranked
- Ties are broken by exact unrounded colour distance; true ties share the same rank
- A match runs for **3 rounds**; score history is tracked per room and (for signed-in players) across all sessions
