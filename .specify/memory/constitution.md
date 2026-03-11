<!--
Sync Impact Report
- Version change: template-unversioned -> 1.0.0
- Modified principles:
  - Principle 1 placeholder -> I. Authoritative Source and Traceability
  - Principle 2 placeholder -> II. Server-Authoritative Architecture
  - Principle 3 placeholder -> III. Backend Engineering Discipline
  - Principle 4 placeholder -> IV. Frontend Engineering Discipline
  - Principle 5 placeholder -> V. Workflow and Validation Gates
- Added sections:
  - Architecture and Implementation Constraints
  - Development Workflow and Review Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ updated .specify/templates/plan-template.md
  - ✅ updated .specify/templates/spec-template.md
  - ✅ updated .specify/templates/tasks-template.md
  - ✅ updated .specify/templates/agent-file-template.md
  - ✅ updated README.md
  - ✅ checked .specify/templates/checklist-template.md (no change required)
  - ✅ checked .specify/templates/constitution-template.md (no change required)
  - ✅ checked .specify/templates/commands/*.md (directory not present; no updates required)
-->

# Blend Colour Game Constitution

## Core Principles

### I. Authoritative Source and Traceability
All generated planning artifacts MUST derive requirements exclusively from
`Blend_Color_Game_User_Stories.md`,
`Blend_Colour_Game_Use_Cases_Scenarios_ATs.md`, `architecture_note.md`,
`coding-standard-python.md`, and `coding-standard-frontend.md`. Every
requirement, acceptance criterion, design constraint, task, and validation item
MUST trace to one or more of those documents. If the source documents do not
fully define a behavior, the artifact MUST mark it as `clarification required`
rather than inventing behavior, actors, permissions, persistence rules, APIs,
flows, scoring rules, or operational assumptions.

Rationale: Later workflow stages are only reliable if the planning inputs remain
the sole source of product truth.

### II. Server-Authoritative Architecture
Blend Colour Game MUST be planned and implemented as a server-authoritative
real-time web application. The frontend MUST be React with TypeScript and MUST
be limited to UI rendering and player interaction. The backend MUST be Django
and MUST own authentication, room management, gameplay logic, persistence, and
APIs. Real-time gameplay updates MUST use WebSockets. Standard operations MUST
use HTTP APIs. The backend server MUST remain the authoritative source of truth
for room membership, host permissions, duplicate display-name enforcement within
a room, minimum player validation, single-player versus multiplayer mode entry,
timer enforcement, submission acceptance or rejection, scoring, ranking, round
transitions, match lifecycle, room locking during active matches, waiting-state
admission for late joiners, room closure and cleanup, room-scoped score
history, and identity-scoped score history where documented. The frontend MUST
never act as the source of truth for gameplay rules or state transitions.

Rationale: The architecture note and use cases define synchronized, fair
multiplayer behavior that depends on backend authority.

### III. Backend Engineering Discipline
Backend code MUST follow the Google Python Style Guide and MUST use Python type
annotations for public interfaces. Django views MUST remain thin and MUST only
validate requests, delegate to services or engine modules, and return
responses. Gameplay logic MUST reside in service or engine modules. Backend code
MUST avoid mutable global state, MUST validate inputs at API and WebSocket
boundaries, and MUST remain modular and testable. Planning artifacts MUST
preserve these separations by assigning gameplay rules, validation, and state
transitions to backend services rather than to controllers or clients.

Rationale: Thin Django views and service-owned game logic are explicit project
standards and are required for maintainability and testability.

### IV. Frontend Engineering Discipline
Frontend code MUST follow the Google TypeScript Style Guide with React
conventions. Frontend implementations MUST use React with TypeScript,
functional components only, and hooks only; class components are prohibited.
Each component MUST live in its own file. Component names MUST use PascalCase.
Variables, hooks, and functions MUST use camelCase. Planning artifacts MUST
separate presentational components from stateful container components and MUST
assign API and WebSocket coordination to container or hook layers. Client-side
state MAY optimize rendering and responsiveness, but it MUST only reflect
server-authoritative state and MUST not redefine gameplay rules.

Rationale: The frontend standards require a predictable component model and
strict separation between presentation and authoritative gameplay state.

### V. Workflow and Validation Gates
The project MUST use a single combined planning branch. The required planning
workflow is `constitution -> specify -> clarify -> validate -> plan ->
checklist -> validate -> tasks -> analyze -> validate`. Every generated stage
MUST be validated against the authoritative documents before the workflow may
continue. If drift, invention, or contradiction is found, the team MUST
regenerate the earlier artifact that introduced the issue instead of patching
downstream artifacts to compensate. All later artifacts MUST satisfy this
constitution's architecture, traceability, ambiguity, and coding-discipline
rules.

Rationale: Regenerating the source artifact prevents requirement drift from
being normalized deeper in the workflow.

## Architecture and Implementation Constraints

Artifacts produced under this constitution MUST preserve the following
constraints:

- The system model MUST remain centered on room state and match state, with
  backend-controlled state transitions.
- Multiplayer entry validation MUST remain server-controlled. Single-player and
  multiplayer behavior MAY be specified only where the authoritative documents
  define it.
- The following ambiguities MUST remain marked as `clarification required`
  unless the authoritative documents are updated: tie-break rule behavior,
  room-to-single-player transitions, room locking versus waiting-state
  admission behavior, and persistence differences for guest versus
  authenticated users.
- Generated artifacts MUST not introduce distributed-service assumptions,
  additional runtime actors, or alternative authority models unless the
  authoritative documents are amended first.
- Validation expectations for implementation planning MUST include backend unit
  and integration coverage for services, APIs, and WebSocket behavior, plus
  frontend coverage for key interaction flows and visible gameplay state
  changes, when those tests are part of the generated scope.

## Development Workflow and Review Gates

The following review gates are mandatory for artifact generation:

- Specifications MUST include source-backed user stories, functional
  requirements, edge cases, and measurable success criteria without invented
  behavior.
- Clarification outputs MUST resolve ambiguities from authoritative sources when
  available and MUST otherwise preserve an explicit `clarification required`
  marker.
- Plans MUST record the selected React plus TypeScript frontend and Django
  backend structure, identify WebSocket and HTTP responsibilities, and pass an
  explicit constitution check before design proceeds.
- Task lists MUST group work by traceable user story or requirement source and
  MUST include validation work for server authority, API or WebSocket boundary
  validation, and applicable tests.
- Validation artifacts MUST check compliance with this constitution, the
  authoritative requirements documents, and the coding standards before later
  stages proceed.

## Governance

This constitution governs all planning artifacts in this repository and
supersedes conflicting workflow guidance in downstream templates. Amendments
MUST update the constitution first, then update any affected templates or
guidance files in the same change. Compliance reviews MUST verify, at minimum,
traceability to authoritative documents, preservation of server-authoritative
architecture, adherence to backend and frontend coding constraints, correct use
of the single combined planning branch, and validation at each required stage.

Versioning policy:

- MAJOR: Remove a principle, materially redefine governance, or permit behavior
  previously prohibited.
- MINOR: Add a new principle or materially expand mandatory guidance.
- PATCH: Clarify wording or fix non-semantic issues without changing
  obligations.

Amendment procedure:

1. Propose the constitutional change with explicit rationale and impacted
   artifacts.
2. Update this document, including the Sync Impact Report and version number.
3. Update dependent templates and runtime guidance in the same change set.
4. Re-run validation on affected planning artifacts before further generation.

**Version**: 1.0.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-11
