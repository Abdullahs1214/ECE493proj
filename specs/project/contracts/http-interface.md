# HTTP Interface Contract

This contract records the HTTP request/response interactions required by the
authoritative sources. It intentionally avoids invented route names or payload
schemas. Exact endpoint paths and field names must be derived during
implementation without changing the required behaviors below.

## Operation Group: Account Entry and Session Management

### OAuth Sign-In

- **Purpose**: Start and complete authenticated player entry.
- **Actors**: Player, OAuth provider, backend server
- **Required Outcomes**:
  - authenticate the player
  - link the OAuth identity to a unique user identity
  - establish an authenticated session
- **Failure Outcomes**:
  - cancellation or denial returns the player to sign-in without an active
    session
  - provider or verification failure does not create a partial account link

### Guest Entry

- **Purpose**: Start guest play without authentication.
- **Actors**: Player, backend server
- **Required Outcomes**:
  - create a guest session
  - generate a temporary guest name
  - allow guest display-name editing before room join
- **Failure Outcomes**:
  - guest play disabled
  - temporary guest identity generation failure
  - guest session creation failure

### Logout

- **Purpose**: End an authenticated session.
- **Actors**: Player, backend server
- **Required Outcomes**:
  - terminate signed-in access

## Operation Group: Room and Lobby Operations

### Room Creation

- **Purpose**: Allow a multiplayer player to create a room.
- **Required Outcomes**:
  - create a room with an identified host
  - allow subsequent room membership management

### Room Join

- **Purpose**: Allow a multiplayer player to join an existing room.
- **Required Outcomes**:
  - enforce room-level duplicate display-name prevention
  - admit late joiners in waiting state if a match is already active
- **Failure Outcomes**:
  - duplicate display name in the room
  - room closure or host absence

### Lobby Browsing

- **Purpose**: Allow players to view available multiplayer rooms or room entry
  state.
- **Required Outcomes**:
  - present joinable room information consistent with current room status

## Operation Group: Profile and History Retrieval

### Profile Retrieval

- **Purpose**: Retrieve signed-in identity presentation information.
- **Required Outcomes**:
  - return display name and profile avatar for lobby presentation

### Match History Retrieval

- **Purpose**: Retrieve room-scoped and identity-scoped score history views.
- **Required Outcomes**:
  - room history remains room-specific
  - signed-in player history persists after room exit
  - guest history remains limited to room duration

## Validation Rules Across HTTP Operations

- Input validation occurs at the backend boundary.
- The backend remains authoritative for room membership, host permissions,
  duplicate display names, mode validation, and history access.
- HTTP operations do not replace the WebSocket channel for real-time gameplay
  state updates.
