# Blend Colour Game – Architecture Note

## System Overview

Blend Colour Game is a **server-authoritative real-time web application**.

The system consists of:

- **Frontend:** React + TypeScript application responsible for UI rendering and user interaction
- **Backend:** Django server responsible for authentication, room management, game lifecycle, and persistence
- **Real-time layer:** WebSocket communication for synchronized room and match updates
- **HTTP APIs:** Used for authentication, lobby actions, profile/history retrieval, and non-real-time operations

This project is **not implemented as a distributed multi-service architecture** unless future requirements explicitly demand it.

---

# Communication Model

## HTTP (request/response)

Used for:

- login / account creation
- guest entry
- room creation
- room joining
- lobby browsing
- profile retrieval
- match history retrieval

## WebSockets (real-time)

Used for:

- room synchronization
- player join/leave updates
- round start notifications
- timer updates
- submission events
- scoring updates
- result publication

---

# Authoritative Server Responsibilities

The Django backend is the **authoritative source of truth** for:

- room membership
- host permissions
- duplicate display-name checks inside a room
- multiplayer start validation
- single-player vs multiplayer mode validation
- round timer enforcement
- submission acceptance or rejection
- scoring calculations
- ranking generation
- round transitions
- match lifecycle transitions
- room locking during active matches
- waiting-state handling for late joiners
- room cleanup and closure
- room-scoped history persistence
- account-scoped history persistence where applicable

Clients must treat all server state as authoritative.

---

# Client Responsibilities

The React frontend is responsible for:

- rendering UI
- collecting user inputs
- displaying color previews
- showing timers and round state
- displaying results and rankings
- presenting match history
- reflecting server state updates

The client **must not implement gameplay rules as the source of truth**.

---

# Core System Model

The system is modeled primarily around:

- **Room State**
- **Match State**

Typical lifecycle:

Lobby → Waiting for players → Round Start → Active Blending → Submission Phase → Scoring → Results → Next Round / Match End

All state transitions are controlled by the backend server.