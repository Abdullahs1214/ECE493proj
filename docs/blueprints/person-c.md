# Blend Colour Game Packet: Person C

## Branch
`feature/person-c-gameplay-scoring`

## Purpose
Implement match lifecycle, round lifecycle, timer enforcement, submission handling, scoring, ranking, result publication, score history behavior, and social interaction around submissions.

## FR Coverage
Primary FR ownership:
- FR-012 to FR-037
- FR-038
- FR-040 where gameplay continuation is affected by player departure
- FR-044 for single-player against the system
- FR-050 to FR-061

## Main Task Mapping
This branch primarily covers and may derive work from:
- T011
- T012
- T013
- T015
- T019 for single-player mode behavior
- T020
- T021
- T022
- T023
- T024
- T029 for history retrieval beyond profile presentation
- T032
- T034
- T035
- T036
- T037 for gameplay/social publication beyond room presence basics
- T038
- T039
- T042
- T044
- T045
- T048
- T049 jointly at integration time
- T051
- T052
- T054
- T055
- T056
- T057

## This Branch Owns
Backend:
- `backend/apps/gameplay/`
- `backend/apps/history/`
- `backend/apps/social/`
- gameplay validators
- `backend/services/mode_service.py` for single-player behavior
- `backend/services/match_service.py`
- `backend/services/history_service.py`
- `backend/services/social_service.py`
- `backend/engine/round_engine.py`
- `backend/engine/scoring_engine.py`
- gameplay/history/social-facing websocket publishers

Frontend:
- gameplay state hook
- gameplay, results, history, and social containers
- gameplay and results components
- HTTP and realtime adapters for gameplay/history/social flows

Tests:
- gameplay, history, and social unit tests
- realtime scoring/results tests
- gameplay integration tests
- frontend gameplay/history/social tests

## This Branch May Edit
- `backend/apps/gameplay/models.py`
- `backend/apps/history/models.py`
- `backend/apps/social/models.py`
- `backend/apps/gameplay/validators.py`
- `backend/services/mode_service.py`
- `backend/services/match_service.py`
- `backend/services/history_service.py`
- `backend/services/social_service.py`
- `backend/engine/round_engine.py`
- `backend/engine/scoring_engine.py`
- history-retrieval parts of `backend/api/views/history_views.py`
- relevant parts of `backend/api/schemas.py`
- relevant route entries in `backend/api/urls.py` during an agreed merge window
- `backend/websockets/messages.py` for gameplay/history/social message definitions only
- `backend/websockets/match_publisher.py`
- `backend/websockets/submission_publisher.py`
- `backend/websockets/results_publisher.py`
- gameplay/social portions of `backend/websockets/presence_publisher.py` only if required by integration
- `frontend/src/hooks/useGameplayState.ts`
- `frontend/src/containers/BlendGameContainer.tsx`
- `frontend/src/containers/ResultsContainer.tsx`
- `frontend/src/containers/HistoryContainer.tsx`
- `frontend/src/containers/SocialPanelContainer.tsx`
- gameplay/history/social components in `frontend/src/components/`
- `frontend/src/services/apiClient.ts` for history HTTP helpers
- `frontend/src/services/realtimeClient.ts` for gameplay and result subscriptions
- related tests only

## This Branch Must Not Implement
- OAuth internals
- guest session lifecycle internals
- room creation or room browsing rules
- host-only room deletion logic except where the gameplay flow must respond to room closure through existing interfaces
- duplicate room display-name enforcement

## Inputs Assumed From Base Foundation
This branch may assume:
- scaffold exists
- room and account structure exist as shared contracts even if not yet fully implemented
- message and route naming rules exist
- service and engine boundaries are frozen

## Required Outputs for Integration
This branch must leave behind:
- gameplay models and validators
- round engine and scoring engine
- match lifecycle orchestration
- submission acceptance and rejection behavior
- score computation and tie-break handling
- results publication behavior
- score history services and retrieval path
- social interaction support
- tests covering gameplay, results, history, and social flows

## Testing Responsibility
Add tests for:
- timer enforcement
- on-time and late submission behavior
- target generation and scoring
- similarity percentage and ranking
- exact unrounded color distance tie-break
- round result publication
- score history persistence rules for signed-in users and room-limited history for guests
- social reactions and preset messages
- frontend gameplay and result rendering based on authoritative backend state

## Codex Prompt Packet
Use the following constraints when prompting Codex on this branch:
- Work only in gameplay, scoring, results, history, and social areas.
- Do not implement auth/session internals or room create/join governance rules.
- Place lifecycle and rules logic in approved services and engines, not in views or frontend code.
- Preserve backend authority for timers, submission acceptance, scoring, ranking, and result publication.
- Use the existing gameplay, history, and social apps; do not create alternate game-state subsystems.
- Preserve the reserved entity names and shared message structure from the integration contract.
