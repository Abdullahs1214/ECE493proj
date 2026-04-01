# Tasks: Blend Colour Game Project Specification

**Input**: Design documents from `/specs/project/`
**Prerequisites**: plan.md (required), spec.md (required), research.md,
data-model.md, contracts/, quickstart.md

**Tests**: Include automated backend and frontend validation required by the
plan, constitution, and coding standards.

**Organization**: Tasks are grouped by implementation phase and architectural
component, while preserving coverage of all functional areas in `spec.md`.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Story coverage is documented at the phase level instead of expanding all 61
  user stories into separate phases

## Path Conventions

- **Backend**: `backend/`
- **Frontend**: `frontend/`
- **Planning docs**: `specs/project/`

## Phase 1: Project Setup and Environment

**Purpose**: Initialize the repository structure, shared tooling, and execution
environment for the server-authoritative web application.

**Covers**: All functional areas through shared project infrastructure

- [X] T001 Create the planned backend and frontend directory structure in `backend/` and `frontend/` (FR-001, FR-038, FR-043)
- [X] T002 Initialize the Django project scaffold in `backend/blend_colour_game/` (FR-001, FR-010, FR-019, FR-038)
- [X] T003 Initialize the frontend application scaffold in `frontend/src/` (FR-012, FR-019, FR-043)
- [X] T004 [P] Configure backend dependency and tooling files in `backend/pyproject.toml` (FR-001, FR-038)
- [X] T005 [P] Configure frontend dependency and tooling files in `frontend/package.json` (FR-012, FR-038, FR-043)
- [X] T006 [P] Add backend environment template and settings bootstrap in `backend/.env.example` (FR-001, FR-038, FR-050)
- [X] T007 [P] Add frontend environment template for API and realtime configuration in `frontend/.env.example` (FR-038, FR-043)
- [X] T008 Configure repository-level developer commands and documentation in `README.md` (FR-001, FR-038, FR-043)

**Checkpoint**: Local project structure and tooling are ready for backend and
frontend feature work.

---

## Phase 2: Backend Data Models

**Purpose**: Create the persistent and runtime-backed backend data layer from
`data-model.md`.

**Covers**: Identity, session, room, membership, match, round, submission,
score, history, and social interaction requirements

- [ ] T009 Create the accounts application models for `PlayerIdentity` and `Session` in `backend/apps/accounts/models.py` (FR-001, FR-002, FR-005, FR-006, FR-007, FR-008, FR-009)
- [ ] T010 Create the rooms application models for `Room` and `RoomMembership` in `backend/apps/rooms/models.py` (FR-010, FR-011, FR-039, FR-041, FR-042, FR-045, FR-046, FR-047, FR-048, FR-049)
- [ ] T011 Create the gameplay application models for `Match`, `Round`, `Submission`, and `ScoreRecord` in `backend/apps/gameplay/models.py` (FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-055, FR-056, FR-057, FR-058)
- [ ] T012 Create the history application model for `ScoreHistoryEntry` in `backend/apps/history/models.py` (FR-050, FR-051, FR-052, FR-053, FR-054)
- [ ] T013 Create the social application model for `SocialInteraction` in `backend/apps/social/models.py` (FR-059, FR-060, FR-061)
- [ ] T014 [P] Add model validation rules for room-level display-name uniqueness and host-only room deletion constraints in `backend/apps/rooms/validators.py` (FR-010, FR-047, FR-048, FR-049)
- [ ] T015 [P] Add gameplay and scoring validation helpers for timer expiry, valid color ranges, and tie-break basis in `backend/apps/gameplay/validators.py` (FR-017, FR-025, FR-027, FR-029, FR-031)
- [ ] T016 Create initial migrations for all backend apps in `backend/apps/` (FR-001, FR-010, FR-019, FR-050, FR-059)

**Checkpoint**: All entities from `data-model.md` exist with validation-aligned
relationships and migrations.

---

## Phase 3: Backend Services and Gameplay Engine Logic

**Purpose**: Implement the authoritative service layer and gameplay engine.

**Covers**: Authentication/session lifecycle, room governance, mode selection,
match lifecycle, scoring, history, and social interactions

- [ ] T017 Implement authenticated and guest session orchestration in `backend/services/identity_service.py` (FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, FR-009)
- [ ] T018 Implement room creation, join, reconnect, host governance, and closure rules in `backend/services/room_service.py` (FR-010, FR-011, FR-045, FR-046, FR-047, FR-048, FR-049)
- [ ] T019 Implement single-player and multiplayer mode selection rules in `backend/services/mode_service.py` (FR-039, FR-043, FR-044, FR-045)
- [ ] T020 Implement match start validation, late-join waiting-state handling, and player-leave continuation rules in `backend/services/match_service.py` (FR-038, FR-039, FR-040, FR-041, FR-042)
- [ ] T021 Implement round lifecycle control, timer enforcement, and submission acceptance or rejection in `backend/engine/round_engine.py` (FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-055, FR-056, FR-057, FR-058)
- [ ] T022 Implement target generation, color-distance scoring, ranking, and tie-break logic in `backend/engine/scoring_engine.py` (FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-034, FR-035, FR-036, FR-037)
- [ ] T023 Implement room-scoped and identity-scoped score history management in `backend/services/history_service.py` (FR-050, FR-051, FR-052, FR-053, FR-054)
- [ ] T024 Implement upvote, highlight, crowd-favorite, and preset-message orchestration in `backend/services/social_service.py` (FR-059, FR-060, FR-061)

**Checkpoint**: The backend owns all gameplay rules and lifecycle transitions
required by the specification.

---

## Phase 4: HTTP API Endpoints

**Purpose**: Expose the standard request/response operations defined in the
HTTP contract.

**Covers**: OAuth entry, guest entry, logout, room creation/joining, lobby
browsing, profile retrieval, and history retrieval

- [ ] T025 Create request and response schemas for account, room, and history operations in `backend/api/schemas.py` (FR-001, FR-002, FR-004, FR-010, FR-045, FR-050, FR-051, FR-052, FR-053, FR-054)
- [ ] T026 Implement OAuth sign-in start and completion views in `backend/api/views/auth_views.py` (FR-001, FR-005, FR-006, FR-007)
- [ ] T027 Implement guest entry and logout views in `backend/api/views/session_views.py` (FR-002, FR-003, FR-004, FR-008, FR-009)
- [ ] T028 Implement room creation, room join, and lobby browsing views in `backend/api/views/room_views.py` (FR-010, FR-011, FR-041, FR-042, FR-045, FR-046, FR-047, FR-048, FR-049)
- [ ] T029 Implement profile retrieval and score-history retrieval views in `backend/api/views/history_views.py` (FR-005, FR-050, FR-051, FR-052, FR-053, FR-054)
- [ ] T030 Wire API URL routing for authentication, room, profile, and history operations in `backend/api/urls.py` (FR-001, FR-002, FR-008, FR-045, FR-050)
- [ ] T031 Add API-boundary validation and error translation for the HTTP contract in `backend/api/exceptions.py` (FR-001, FR-002, FR-010, FR-045, FR-050)

**Checkpoint**: All non-realtime operations are available through thin,
validated backend endpoints.

---

## Phase 5: WebSocket Realtime Events and Room Synchronization

**Purpose**: Implement authoritative realtime synchronization for room and
match events.

**Covers**: Room sync, join/leave updates, round starts, timers, submissions,
scoring, results, waiting-state, and social updates

- [ ] T032 Implement shared realtime message schemas and serializers in `backend/websockets/messages.py` (FR-038, FR-041, FR-042, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060, FR-061)
- [ ] T033 Implement room connection and membership consumers in `backend/websockets/room_consumer.py` (FR-011, FR-038, FR-041, FR-042, FR-046, FR-049)
- [ ] T034 Implement match lifecycle, round start, and timer publication in `backend/websockets/match_publisher.py` (FR-013, FR-019, FR-027, FR-028, FR-032, FR-033, FR-038, FR-039)
- [ ] T035 Implement submission receipt, rejection, and submission-order updates in `backend/websockets/submission_publisher.py` (FR-030, FR-031, FR-055, FR-056, FR-057, FR-058)
- [ ] T036 Implement scoring, results, and visual-feedback publication in `backend/websockets/results_publisher.py` (FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-034, FR-035, FR-036, FR-037)
- [ ] T037 Implement waiting-state, reconnect, and social-interaction updates in `backend/websockets/presence_publisher.py` (FR-011, FR-040, FR-041, FR-042, FR-059, FR-060, FR-061)

**Checkpoint**: Realtime room and gameplay state flows from backend authority to
connected clients.

---

## Phase 6: Frontend React Components and State Management

**Purpose**: Build the React client to render authoritative state and collect
player input.

**Covers**: Entry flows, mode selection, room views, blending UI, round
feedback, history, submission awareness, and social interactions

- [ ] T038 Define shared frontend types for identities, rooms, matches, rounds, submissions, scores, and history in `frontend/src/types/game.ts` (FR-001, FR-002, FR-010, FR-019, FR-038, FR-050, FR-059)
- [ ] T039 Implement HTTP and WebSocket client adapters in `frontend/src/services/apiClient.ts` and `frontend/src/services/realtimeClient.ts` (FR-001, FR-002, FR-008, FR-038, FR-045, FR-050)
- [ ] T040 Implement entry and mode-selection state hooks in `frontend/src/hooks/useSessionState.ts` and `frontend/src/hooks/useModeSelection.ts` (FR-001, FR-002, FR-003, FR-004, FR-007, FR-008, FR-009, FR-043, FR-044, FR-045)
- [ ] T041 Implement room and lobby synchronization hooks in `frontend/src/hooks/useRoomState.ts` (FR-010, FR-011, FR-038, FR-041, FR-042, FR-046, FR-049)
- [ ] T042 Implement gameplay state hooks for rounds, timers, submissions, results, and waiting-state in `frontend/src/hooks/useGameplayState.ts` (FR-013, FR-015, FR-018, FR-019, FR-023, FR-027, FR-028, FR-030, FR-031, FR-033, FR-034, FR-035, FR-036, FR-037, FR-055, FR-056, FR-057, FR-058)
- [ ] T043 Implement entry, lobby, and history container components in `frontend/src/containers/EntryContainer.tsx`, `frontend/src/containers/LobbyContainer.tsx`, and `frontend/src/containers/HistoryContainer.tsx` (FR-001, FR-002, FR-004, FR-005, FR-043, FR-045, FR-046, FR-050, FR-051, FR-052, FR-053, FR-054)
- [ ] T044 Implement blending, results, and social container components in `frontend/src/containers/BlendGameContainer.tsx`, `frontend/src/containers/ResultsContainer.tsx`, and `frontend/src/containers/SocialPanelContainer.tsx` (FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-021, FR-022, FR-023, FR-024, FR-025, FR-026, FR-034, FR-035, FR-036, FR-037, FR-059, FR-060, FR-061)
- [ ] T045 Implement presentational components for auth, room, timer, color controls, submission status, rankings, and preset messages in `frontend/src/components/` (FR-005, FR-012, FR-014, FR-018, FR-028, FR-035, FR-055, FR-056, FR-057, FR-058, FR-061)

**Checkpoint**: The frontend can render all planned flows while treating the
backend as the source of truth.

---

## Phase 7: Integration and End-to-End Gameplay Flow

**Purpose**: Connect backend and frontend layers into cohesive single-player
and multiplayer experiences.

**Covers**: End-to-end entry, room flow, realtime match progression, scoring,
history, and social interaction

- [ ] T046 Integrate backend services with HTTP views and WebSocket publishers in `backend/api/` and `backend/websockets/` (FR-001, FR-010, FR-019, FR-038, FR-045, FR-050, FR-059)
- [ ] T047 Integrate frontend entry, room, gameplay, history, and social containers with backend clients in `frontend/src/containers/` (FR-001, FR-012, FR-038, FR-043, FR-050, FR-059)
- [ ] T048 Implement end-to-end single-player flow wiring in `backend/services/mode_service.py` and `frontend/src/containers/BlendGameContainer.tsx` (FR-043, FR-044)
- [ ] T049 Implement end-to-end multiplayer room and match flow wiring in `backend/services/match_service.py` and `frontend/src/containers/LobbyContainer.tsx` (FR-010, FR-011, FR-038, FR-039, FR-040, FR-041, FR-042, FR-045, FR-046, FR-049)
- [ ] T050 Run the quickstart walkthrough against the integrated architecture and record follow-up fixes in `specs/project/quickstart.md` (FR-001, FR-038, FR-043, FR-050, FR-059)

**Checkpoint**: The planned system supports end-to-end gameplay flows across
all major functional areas.

---

## Phase 8: Automated Testing and Validation

**Purpose**: Add automated validation for backend, frontend, and cross-layer
requirements.

**Covers**: Model validation, service rules, HTTP contract behavior, realtime
events, UI state transitions, and quickstart-aligned integration flows

- [ ] T051 [P] Add backend model and validation tests for identities, rooms, gameplay, history, and social entities in `backend/tests/unit/test_models.py` (FR-001, FR-010, FR-019, FR-050, FR-059)
- [ ] T052 [P] Add backend service and engine tests for room lifecycle, timers, submissions, scoring, ranking, and history rules in `backend/tests/unit/test_services.py` (FR-011, FR-025, FR-027, FR-031, FR-039, FR-040, FR-041, FR-042, FR-050)
- [ ] T053 [P] Add HTTP contract tests for auth, guest entry, room, profile, and history operations in `backend/tests/contract/test_http_contract.py` (FR-001, FR-002, FR-008, FR-045, FR-050)
- [ ] T054 [P] Add WebSocket contract tests for room sync, timers, submissions, scoring, results, and waiting-state events in `backend/tests/contract/test_realtime_contract.py` (FR-038, FR-041, FR-042, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060, FR-061)
- [ ] T055 [P] Add backend integration tests for single-player and multiplayer match progression in `backend/tests/integration/test_gameplay_flow.py` (FR-019, FR-027, FR-038, FR-039, FR-043, FR-044, FR-045)
- [ ] T056 [P] Add frontend component and hook tests for entry, lobby, gameplay, history, and social views in `frontend/tests/unit/` (FR-001, FR-005, FR-012, FR-028, FR-050, FR-055, FR-061)
- [ ] T057 [P] Add frontend integration tests for authoritative state updates and visible gameplay transitions in `frontend/tests/integration/test_gameplay_ui.tsx` (FR-038, FR-041, FR-042, FR-043, FR-050, FR-059)
- [ ] T058 Re-run checklist, quickstart, and constitution-alignment validation and capture results in `specs/project/checklists/quality.md` and `specs/project/checklists/requirements.md` (FR-001, FR-038, FR-043, FR-050, FR-059)

**Checkpoint**: Automated validation covers the planned backend, frontend, API,
and realtime behavior.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies; starts immediately.
- **Phase 2**: Depends on Phase 1; data models require project scaffolding.
- **Phase 3**: Depends on Phase 2; services and engine logic depend on models.
- **Phase 4**: Depends on Phase 3; HTTP endpoints stay thin and call services.
- **Phase 5**: Depends on Phase 3; realtime publishers depend on service and
  engine logic.
- **Phase 6**: Depends on Phases 1, 4, and 5; frontend state depends on API
  and realtime interfaces.
- **Phase 7**: Depends on Phases 4, 5, and 6; end-to-end flows require both
  backend and frontend connectivity.
- **Phase 8**: Depends on Phases 2 through 7; automated validation targets the
  integrated system.

### Functional Coverage Dependencies

- Player entry and identity flows depend on Phases 2, 3, 4, 6, and 8.
- Room governance and multiplayer lifecycle depend on Phases 2, 3, 4, 5, 6,
  7, and 8.
- Blending, scoring, submissions, and results depend on Phases 2, 3, 5, 6, 7,
  and 8.
- History and social interaction depend on Phases 2, 3, 4, 5, 6, 7, and 8.

### Dependency Graph

`Phase 1 -> Phase 2 -> Phase 3 -> (Phase 4 + Phase 5) -> Phase 6 -> Phase 7 -> Phase 8`

### Within Each Phase

- Models before services and engine logic
- Services and engine logic before HTTP or WebSocket interfaces
- Backend interfaces before frontend integration
- Integration before final automated validation

## Parallel Opportunities

- **Phase 1**: T004-T007 can run in parallel after T001-T003 establish the base
  structure.
- **Phase 2**: T014 and T015 can run in parallel after core model files exist.
- **Phase 4**: T026-T029 can proceed in parallel after T025 defines shared API
  schemas.
- **Phase 5**: T034-T037 can proceed in parallel after T032-T033 define the
  shared realtime message foundation.
- **Phase 6**: T040-T045 can be split across multiple contributors after T038
  and T039 establish shared types and service clients.
- **Phase 8**: T051-T057 can run in parallel once the integrated system exists.

## Parallel Example: Backend Interfaces

```bash
Task: "T026 Implement OAuth sign-in start and completion views in backend/api/views/auth_views.py"
Task: "T028 Implement room creation, room join, and lobby browsing views in backend/api/views/room_views.py"
Task: "T029 Implement profile retrieval and score-history retrieval views in backend/api/views/history_views.py"
```

## Parallel Example: Frontend State and UI

```bash
Task: "T041 Implement room and lobby synchronization hooks in frontend/src/hooks/useRoomState.ts"
Task: "T042 Implement gameplay state hooks for rounds, timers, submissions, results, and waiting-state in frontend/src/hooks/useGameplayState.ts"
Task: "T045 Implement presentational components for auth, room, timer, color controls, submission status, rankings, and preset messages in frontend/src/components/"
```

## Implementation Strategy

### MVP First

1. Complete Phases 1 through 5 to establish the backend authority model and
   transport layers.
2. Complete the minimum frontend work from Phase 6 needed for player entry,
   room participation, timed rounds, submission, scoring, and results.
3. Complete T048, T049, T055, and T057 to validate core end-to-end gameplay.
4. Stop and validate the quickstart walkthrough before expanding history and
   social refinements.

### Incremental Delivery

1. Setup and data models
2. Backend authority logic
3. HTTP and WebSocket surfaces
4. Frontend state and UI
5. End-to-end integration
6. Automated validation and documentation refresh

### Suggested MVP Scope

- Phases 1 through 5
- Phase 6 tasks T038-T044
- Phase 7 tasks T046-T049
- Phase 8 tasks T051-T055 and T057

## Notes

- All tasks follow the required checkbox and task-ID format and include file
  paths.
- The task list is intentionally phase-oriented and concise, per the user
  request, while still covering all functional areas in `spec.md`.
- Tests are included because the plan and constitution require automated
  validation for backend services, APIs, WebSockets, and frontend state
  transitions.
