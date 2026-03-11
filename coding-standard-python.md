# Backend Coding Standard – Python

The backend follows the **Google Python Style Guide**.

## General Principles

- Follow PEP8 formatting where consistent with Google style.
- Use **type annotations** for all public APIs.
- Keep functions small, focused, and testable.
- Prefer explicit code over implicit behavior.

---

# Project Structure

Django applications should maintain clear separation of responsibilities.

Typical structure:

- **views/controllers** → handle HTTP requests
- **services/game engine modules** → contain gameplay logic
- **models** → persistence and relationships
- **serializers/schemas** → validation and API boundaries
- **tests** → unit and integration testing

---

# Views

Views must remain **thin**.

Views should only:

- validate requests
- call services
- return responses

Views **must not contain gameplay logic**.

---

# Game Logic

Gameplay logic must live in **service or engine modules**.

Benefits:

- better testability
- clearer architecture
- easier maintenance

---

# State Management

- Avoid mutable global state.
- Room state must be managed through explicit services.
- Match state transitions must be controlled through backend logic.

---

# Error Handling

- Use explicit exceptions.
- Avoid silent failures.
- Errors should produce predictable responses.

---

# Testing

The backend must include tests for:

- model behavior
- service/game logic
- API endpoints
- WebSocket behavior

Tests should be deterministic and reproducible.