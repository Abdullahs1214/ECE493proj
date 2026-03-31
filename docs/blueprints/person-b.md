# Blend Colour Game Packet: Person B

## Branch
`feature/person-b-room-lobby`

## Purpose
Implement room creation, room join, room membership, host governance, lobby visibility, reconnect behavior, and waiting-state admission for late joiners.

## FR Coverage
Primary FR ownership:
- FR-010
- FR-011
- FR-039 only where room readiness/start eligibility is surfaced at the room level
- FR-041
- FR-042
- FR-045
- FR-046
- FR-047
- FR-048
- FR-049

## Main Task Mapping
This branch primarily covers and may derive work from:
- T010
- T014
- T018
- T019 only for multiplayer entry handoff into room creation or join
- T020 for waiting-state and player-leave room continuation boundaries that are room-facing
- T028
- T032 only for room and presence message shapes relevant to room/lobby state
- T033
- T037 for reconnect and waiting-state presence updates
- T041
- T043 for lobby container work
- T051
- T052
- T053
- T054
- T056
- T057

## This Branch Owns
Backend:
- `backend/apps/rooms/`
- room validators
- `backend/services/room_service.py`
- room-facing portions of `backend/services/match_service.py` only when needed for waiting-state or leave/reconnect boundaries
- room and lobby HTTP views
- room and presence websocket boundaries

Frontend:
- room and lobby synchronization hook
- room and lobby containers
- room-related presentational components
- room-facing realtime client wiring

Tests:
- room and lobby unit tests
- room contract tests
- room/presence realtime tests
- room/lobby frontend tests

## This Branch May Edit
- `backend/apps/rooms/models.py`
- `backend/apps/rooms/validators.py`
- `backend/services/room_service.py`
- room-related sections of `backend/services/match_service.py` only where explicitly required for room continuation or waiting-state handling
- `backend/api/views/room_views.py`
- relevant parts of `backend/api/schemas.py`
- relevant route entries in `backend/api/urls.py` during an agreed merge window
- `backend/websockets/messages.py` for room/presence message definitions only
- `backend/websockets/room_consumer.py`
- `backend/websockets/presence_publisher.py` for room membership, reconnect, waiting-state, and host visibility updates only
- `frontend/src/hooks/useRoomState.ts`
- `frontend/src/containers/LobbyContainer.tsx`
- room and lobby components in `frontend/src/components/`
- `frontend/src/services/apiClient.ts` only for room HTTP helpers
- `frontend/src/services/realtimeClient.ts` only for room/presence subscriptions
- related tests only

## This Branch Must Not Implement
- OAuth or guest session internals
- scoring or tie-break logic
- target generation
- round timers
- submission validation
- result publication details beyond room-presence visibility
- history persistence or retrieval logic
- crowd favorite logic or preset messaging logic

## Inputs Assumed From Base Foundation
This branch may assume:
- project scaffolds exist
- shared account/session foundation exists or will merge separately
- route and message naming contract exists
- frontend and backend service adapters exist as scaffolds

## Required Outputs for Integration
This branch must leave behind:
- room and room membership models
- room validation rules
- room create/join/browse flow
- duplicate room-name prevention behavior where specified by the requirements
- reconnect and waiting-state room behavior
- host identification and host-only deletion logic
- room-facing realtime synchronization
- tests validating room governance and waiting-state behavior

## Testing Responsibility
Add tests for:
- duplicate display-name prevention within a room
- reconnect to same room
- host-only deletion
- automatic room closure when host leaves or deletes
- waiting-state admission for late joiners
- room/lobby UI visibility and synchronization

## Codex Prompt Packet
Use the following constraints when prompting Codex on this branch:
- Work only in the room, lobby, membership, reconnect, and waiting-state areas.
- Do not implement auth/session internals, scoring, round engine logic, timers, or history logic.
- Use the existing rooms app and room service structure; do not create parallel room subsystems.
- Keep HTTP views thin and place room rules in `room_service.py` or the approved room-facing service layer.
- Realtime updates on this branch must be limited to room membership, room state, reconnect, waiting-state, and host visibility concerns.
- Do not invent alternate event names or duplicate room state models.
