# Research: Blend Colour Game Project Specification

## Decision 1: Use a server-authoritative web application topology

- **Decision**: Implement the system as a browser-based web application with a
  React + TypeScript frontend and a Django backend.
- **Rationale**: The architecture note explicitly defines a server-authoritative
  real-time web application with those frontend and backend responsibilities.
- **Alternatives considered**:
  - Single-process frontend-heavy gameplay logic: rejected because the backend
    must remain the authoritative source of truth.
  - Distributed multi-service architecture: rejected because the architecture
    note explicitly says the project is not a distributed multi-service system
    unless future requirements demand it.

## Decision 2: Split communication by operation type

- **Decision**: Use HTTP request/response for authentication, guest entry, room
  creation and joining, lobby browsing, profile retrieval, and history
  retrieval; use WebSockets for room synchronization, player join and leave
  updates, round starts, timer updates, submission events, scoring updates, and
  result publication.
- **Rationale**: The architecture note assigns standard operations to HTTP and
  synchronized gameplay updates to WebSockets.
- **Alternatives considered**:
  - HTTP-only polling: rejected because the source documents require
    synchronized real-time room and match behavior.
  - WebSocket-only transport: rejected because the architecture note preserves
    standard operations as HTTP APIs.

## Decision 3: Keep gameplay logic in backend services and engine modules

- **Decision**: Reserve backend views or controllers for request validation and
  response handling, and place room validation, timer enforcement, submission
  acceptance, scoring, ranking, and lifecycle transitions in backend services
  or engine modules.
- **Rationale**: The constitution and backend coding standard require thin
  Django views and service-owned gameplay logic.
- **Alternatives considered**:
  - Controller-driven gameplay logic: rejected because it violates the backend
    coding standard.
  - Client-side rule execution: rejected because the backend must remain
    authoritative.

## Decision 4: Model the domain around room state and match state

- **Decision**: Use Room State and Match State as the core domain model anchors,
  with explicit state transitions for waiting, active rounds, scoring, results,
  waiting late joiners, and room closure.
- **Rationale**: The architecture note names Room State and Match State as the
  primary system model and defines a backend-controlled lifecycle.
- **Alternatives considered**:
  - Flat endpoint-only design with no explicit state model: rejected because it
    obscures the lifecycle and complicates authoritative transitions.
  - Frontend-managed state transitions: rejected because it violates server
    authority.

## Decision 5: Keep frontend state synchronization separate from presentation

- **Decision**: Organize the frontend into presentational components plus
  stateful containers, hooks, and service adapters that communicate with the
  backend.
- **Rationale**: The frontend coding standard requires one component per file,
  functional components only, hooks only, and separation of presentational and
  container concerns.
- **Alternatives considered**:
  - Mixed presentation and transport logic in components: rejected because it
    weakens separation of concerns.
  - Class-based React components: rejected by the frontend coding standard.

## Decision 6: Persist identities and histories while keeping live match state authoritative

- **Decision**: Persist user identity, room identity, room-scoped score
  history, and identity-linked score history where applicable; manage live room
  membership, waiting status, timers, and round state through backend services
  as authoritative runtime state.
- **Rationale**: The source documents require persistence for accounts and score
  history while also assigning room, timer, and match lifecycle control to the
  backend authority model.
- **Alternatives considered**:
  - Persistent storage for every transient round tick: rejected because the
    authoritative sources do not require that level of persistence.
  - Client-managed room or timer state: rejected because the backend must own
    authoritative gameplay state.

## Decision 7: Use requirement-aligned automated validation

- **Decision**: Plan backend automated tests for models, services, APIs, and
  WebSocket behavior, plus frontend automated tests for key interaction flows,
  visible state transitions, and submission/result updates.
- **Rationale**: The coding standards explicitly require those test categories,
  and the constitution requires validation work for API, WebSocket, and
  user-story compliance before downstream generation.
- **Alternatives considered**:
  - API-only tests: rejected because gameplay logic and WebSocket behavior are
    authoritative and require direct validation.
  - Manual-only UI validation: rejected because the coding standard expects
    frontend test coverage for key flows and visible gameplay transitions.
