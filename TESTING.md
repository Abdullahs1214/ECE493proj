# Testing Guide

## Backend

Run the backend smoke test from `backend/`:

```bash
pytest
```

Lint backend files:

```bash
ruff check .
```

The backend smoke test validates `GET /health/`.

## Frontend

Run the frontend unit test from `frontend/`:

```bash
npm run test
```

Build validation:

```bash
npm run build
```

The frontend test validates the minimal health-check screen render path.
