# Blend Colour Game Packet: Person A

## Branch
`feature/person-a-identity-session`

## Purpose
Implement the identity and session boundary of the system, including authenticated entry, guest entry, session lifecycle, logout, profile retrieval, and entry-related frontend flows.

## FR Coverage
Primary FR ownership:
- FR-001 to FR-009
- FR-043 as it relates to entry and mode selection handoff
- FR-005 where profile identity presentation is needed in the lobby

## Main Task Mapping
This branch primarily covers and may derive work from:
- T009
- T017
- T025
- T026
- T027
- T029 for profile retrieval only
- T038
- T039
- T040
- T043 for entry and profile containers
- T051
- T053
- T056

## This Branch Owns
Backend:
- `backend/apps/accounts/`
- `backend/services/identity_service.py`
- HTTP entry/session views and schemas related to auth, guest entry, logout, and profile retrieval

Frontend:
- entry-related types if needed
- `frontend/src/hooks/useSessionState.ts`
- `frontend/src/hooks/useModeSelection.ts` only for entry handoff and mode choice state, not room or gameplay logic
- entry and profile containers and presentational components
- auth-related service client calls

Tests:
- account and session unit tests
- auth and session contract tests
- entry/profile frontend tests

## This Branch May Edit
- `backend/apps/accounts/models.py`
- `backend/services/identity_service.py`
- `backend/api/views/auth_views.py`
- `backend/api/views/session_views.py`
- profile retrieval logic inside `backend/api/views/history_views.py` only if the team keeps profile retrieval there
- relevant parts of `backend/api/schemas.py`
- relevant route entries in `backend/api/urls.py` during an agreed merge window
- `frontend/src/hooks/useSessionState.ts`
- `frontend/src/hooks/useModeSelection.ts`
- `frontend/src/containers/EntryContainer.tsx`
- profile-related frontend container or component files
- auth-related presentational components in `frontend/src/components/`
- `frontend/src/services/apiClient.ts` only for auth/profile request helpers
- related tests only

## This Branch Must Not Implement
- room creation, room join, host deletion, lobby membership, or waiting-state logic
- match lifecycle or minimum-player start logic
- timer enforcement
- submission handling
- scoring or tie-break logic
- history persistence rules beyond reading the current player identity or profile presentation
- websocket gameplay publishers

## Inputs Assumed From Base Foundation
This branch may assume:
- backend and frontend scaffolds exist
- health check exists
- environment templates exist
- shared naming contract exists
- thin API boundary structure exists

## Required Outputs for Integration
This branch must leave behind:
- identity and session models wired in the accounts app
- authenticated entry scaffold or implementation path
- guest entry path
- logout path
- session state management in frontend hooks
- profile retrieval/presentation path
- tests validating entry and session behavior

## Testing Responsibility
Add tests for:
- guest entry creation
- session expiration behavior if implemented in scope
- logout behavior
- profile retrieval behavior
- frontend entry rendering and state transitions

## Codex Prompt Packet
Use the following constraints when prompting Codex on this branch:
- Work only in the identity, session, entry, and profile areas.
- Do not implement room logic, gameplay logic, scoring, timers, or history persistence behavior.
- Keep Django views thin and place entry/session orchestration in `identity_service.py`.
- Use the existing accounts app and do not create alternate identity or auth subsystems.
- Frontend code may manage entry and session state only; it must not become authoritative for gameplay or room state.
- Preserve the shared route and schema structure and do not rename shared domain concepts.
