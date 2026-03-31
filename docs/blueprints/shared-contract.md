# Blend Colour Game Shared Integration Contract

## Purpose
This document freezes the ownership boundaries, shared names, and integration assumptions for the Blend Colour Game implementation. Its purpose is to prevent duplicate abstractions, conflicting route or event names, overlapping models, and branch-level drift during team implementation.

## Source of Truth
All implementation work must remain consistent with the existing constitution, specification, plan, tasks, data model, HTTP contract, and realtime contract already approved for this project.

## Global Rules
- The backend is the authoritative source of truth for room state, match state, timer progression, submission acceptance or rejection, scoring, ranking, room closure, waiting-state admission, and history behavior.
- The frontend may render state and collect player input, but must not decide gameplay rules, timer outcomes, room transitions, or ranking logic.
- HTTP is reserved for standard request-response operations such as account entry, guest entry, logout, room creation and joining, lobby browsing, profile retrieval, and history retrieval.
- WebSockets are reserved for authoritative realtime synchronization such as room updates, match lifecycle events, timer updates, submissions, scoring, results, waiting-state updates, reconnect visibility, and social updates.
- No branch may invent new domain entities, authority rules, alternate service boundaries, or duplicated subsystems.
- Each branch must modify only its owned directories except where a shared file change is explicitly required by this contract.

## Shared Domain Ownership
Person A owns:
- Player identity
- Session lifecycle
- Entry flows
- Profile retrieval and presentation

Person B owns:
- Room lifecycle
- Room membership
- Lobby visibility and room governance
- Waiting-state admission and reconnect behavior at the room level

Person C owns:
- Match lifecycle
- Round lifecycle
- Submission handling
- Scoring and ranking
- Results publication
- Score history and social interaction

## Shared Backend Structure
The backend must keep this structure and responsibility split:
- `backend/apps/accounts/` for identity and session models
- `backend/apps/rooms/` for room and room membership models
- `backend/apps/gameplay/` for match, round, submission, and score models
- `backend/apps/history/` for score history models
- `backend/apps/social/` for social interaction models
- `backend/services/` for orchestration and domain services
- `backend/engine/` for core gameplay and scoring logic
- `backend/api/` for thin HTTP boundary code only
- `backend/websockets/` for thin realtime boundary code and publishers only

## Shared Frontend Structure
The frontend must keep this structure and responsibility split:
- `frontend/src/components/` for presentational components only
- `frontend/src/containers/` for stateful feature containers
- `frontend/src/hooks/` for feature state and synchronization hooks
- `frontend/src/services/` for HTTP and realtime transport adapters
- `frontend/src/types/` for shared frontend types
- `frontend/src/pages/` only if a page-level wrapper is genuinely required; do not duplicate container responsibilities here

## Reserved Shared Names
Do not rename or duplicate these concepts.

Backend apps:
- `accounts`
- `rooms`
- `gameplay`
- `history`
- `social`

Backend services:
- `identity_service.py`
- `room_service.py`
- `mode_service.py`
- `match_service.py`
- `history_service.py`
- `social_service.py`

Backend engines:
- `round_engine.py`
- `scoring_engine.py`

Backend HTTP boundaries:
- `auth_views.py`
- `session_views.py`
- `room_views.py`
- `history_views.py`
- `schemas.py`
- `exceptions.py`
- `urls.py`

Backend realtime boundaries:
- `messages.py`
- `room_consumer.py`
- `match_publisher.py`
- `submission_publisher.py`
- `results_publisher.py`
- `presence_publisher.py`

Frontend shared files:
- `apiClient.ts`
- `realtimeClient.ts`
- `game.ts`
- `useSessionState.ts`
- `useModeSelection.ts`
- `useRoomState.ts`
- `useGameplayState.ts`

## Reserved Entity Names
The implementation must preserve these domain names:
- `PlayerIdentity`
- `Session`
- `Room`
- `RoomMembership`
- `Match`
- `Round`
- `Submission`
- `ScoreRecord`
- `ScoreHistoryEntry`
- `SocialInteraction`

## Reserved Shared Behavior Names
When referring to shared behavior in code, docs, and tests, use the following exact concepts rather than introducing synonyms:
- authenticated session
- guest session
- room host
- waiting state
- waiting for next game
- match start
- round start
- submission receipt
- submission rejection
- scoring update
- result publication
- room-scoped history
- identity-scoped history
- crowd favorite

## Shared File Rules
These files are shared danger zones and should be edited by one designated person at a time only:
- `backend/api/urls.py`
- `backend/api/schemas.py`
- `backend/websockets/messages.py`
- frontend top-level app router or page registration file
- shared frontend type files
- shared environment templates
- `README.md`
- `TESTING.md`

## Merge Expectations
Before merging any feature branch into `dev`:
- the branch must stay within its owned surface area
- tests for the branch’s owned functionality must run
- no shared name in this contract may be renamed without team agreement
- no duplicate model, service, engine, or publisher may be introduced
- backend authority rules must remain preserved
- the branch must note which FR ranges it covers

## Codex Operating Rules
Every Codex prompt used by the team must include these constraints:
- do not refactor unrelated files
- do not invent alternate abstractions for existing domain concepts
- do not rename shared files or entities
- preserve existing tests unless the task explicitly updates them
- extend the existing project structure rather than introducing parallel structures
- stay within the owned directories named in the branch packet
