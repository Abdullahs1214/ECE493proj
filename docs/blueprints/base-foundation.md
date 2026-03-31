# Blend Colour Game Base Foundation Packet

## Branch
`feature/base-foundation`

## Purpose
Create the smallest shared implementation scaffold that all other feature branches will build from. This branch must establish structure, tooling, and naming without pre-implementing major feature logic.

## Source Constraints
This branch must follow the constitution, plan, tasks, and contracts exactly. It must not implement speculative features or encode gameplay decisions that belong in later branches.

## This Branch Owns
- repository-level scaffolding
- backend project scaffold
- frontend project scaffold
- environment templates
- developer documentation bootstrap
- shared contract and blueprint document placement
- one health check path proving frontend-backend connectivity
- empty directory structure matching the approved plan

## This Branch Must Create
Repository-level:
- `README.md`
- `TESTING.md`
- `docs/blueprints/`
- `docs/contracts/`
- `.gitignore`

Backend:
- `backend/`
- `backend/blend_colour_game/`
- `backend/apps/accounts/`
- `backend/apps/rooms/`
- `backend/apps/gameplay/`
- `backend/apps/history/`
- `backend/apps/social/`
- `backend/services/`
- `backend/engine/`
- `backend/api/`
- `backend/websockets/`
- `backend/tests/unit/`
- `backend/tests/integration/`
- `backend/tests/contract/`
- backend dependency file
- backend environment template
- backend settings bootstrap
- one `/health` endpoint or equivalent minimal verification endpoint

Frontend:
- `frontend/`
- `frontend/src/components/`
- `frontend/src/containers/`
- `frontend/src/hooks/`
- `frontend/src/pages/`
- `frontend/src/services/`
- `frontend/src/types/`
- `frontend/tests/unit/`
- `frontend/tests/integration/`
- frontend dependency file
- frontend environment template
- minimal app shell
- one minimal frontend path or screen that successfully calls the backend health endpoint

Docs:
- `docs/blueprints/shared-integration-contract.md`
- `docs/blueprints/base-foundation-packet.md`
- placeholders for teammate packets
- `docs/contracts/implementation-notes.md` if needed for setup or shared naming notes

## This Branch Must Not Implement
- real OAuth flow
- guest session rules beyond placeholder scaffolding
- room creation or join logic
- lobby behavior
- match lifecycle
- timer logic
- submission logic
- scoring logic
- history logic
- social logic
- full websocket behavior beyond minimal wiring scaffold

## Required Outputs for Integration
After this branch is merged, teammates must be able to assume:
- backend project boots
- frontend project boots
- backend and frontend dependency setup is documented
- environment templates exist
- the repository structure is stable
- shared names and directory boundaries are frozen
- a health check proves the two sides can communicate

## Shared Files This Branch May Edit
Because this branch establishes the base, it may edit shared foundation files including:
- backend config and settings bootstrap
- frontend app shell/bootstrap files
- `README.md`
- `TESTING.md`
- environment templates

## Testing Responsibility
This branch must add:
- one backend smoke test for the health endpoint
- one frontend smoke test or minimal render test if practical
- documented commands in `README.md` and `TESTING.md` showing how to start the backend and frontend locally

## Codex Prompt Packet
Use the following constraints when prompting Codex on this branch:
- Build only the minimal shared scaffold required for later branches.
- Follow the approved backend and frontend directory structure exactly.
- Do not implement business logic for rooms, gameplay, scoring, history, or social features.
- Add only a health endpoint and minimal frontend-to-backend connectivity proof.
- Preserve server-authoritative boundaries and do not move game logic into the frontend.
- Keep Django views thin and create only scaffold placeholders where needed.
- Do not rename any reserved entity, service, engine, or module names from the shared integration contract.
