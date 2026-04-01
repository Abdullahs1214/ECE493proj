# Implementation Notes

This document captures repository-level setup notes for the base foundation
scaffold.

- Backend entry point: `backend/manage.py`
- Backend health endpoint: `GET /health/`
- Frontend health check: `frontend/src/services/apiClient.ts`
- This scaffold intentionally excludes business logic, models, services,
  websocket handlers, and detailed API views.
