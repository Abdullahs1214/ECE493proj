# Blend Colour Game – ECE 493 Project

This repository now contains the approved planning artifacts plus a minimal
Phase 1 scaffold for the server-authoritative Blend Colour Game application.

## Authoritative Inputs

- `Blend_Color_Game_User_Stories.md`
- `Blend_Colour_Game_Use_Cases_Scenarios_ATs.md`
- `architecture_note.md`
- `coding-standard-python.md`
- `coding-standard-frontend.md`
- `docs/blueprints/shared-contract.md`
- `docs/blueprints/base-foundation.md`

## Scaffold Scope

The current implementation is intentionally limited to the base foundation:

- Django project bootstrap in `backend/`
- minimal app registration for reserved backend apps
- one backend health endpoint at `GET /health/`
- one backend smoke test
- React + TypeScript frontend bootstrap in `frontend/`
- one frontend health-check screen that calls the backend health endpoint

No gameplay, room, scoring, history, websocket, service-layer, or detailed
model logic has been implemented.

## Backend Setup

1. `cd backend`
2. Create a virtual environment and install dependencies:
   `python -m venv .venv && source .venv/bin/activate`
3. Install packages:
   `python -m pip install -e .`
4. Start the development server:
   `python manage.py runserver`

The backend will expose `http://localhost:8000/health/`.

## Frontend Setup

1. `cd frontend`
2. Install dependencies:
   `npm install`
3. Start the development server:
   `npm run dev`

Set `VITE_API_BASE_URL` if the backend is not running at
`http://localhost:8000`.

## Development Commands

Backend:

- `cd backend && pytest`
- `cd backend && ruff check .`

Frontend:

- `cd frontend && npm run test`
- `cd frontend && npm run build`

## Notes

The project uses a single combined planning branch for specification work, but
this scaffold follows the repository structure and naming frozen by the shared
contract and foundation blueprint.
