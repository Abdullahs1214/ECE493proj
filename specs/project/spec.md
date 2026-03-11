# Feature Specification: Blend Colour Game Project Specification

**Feature Branch**: `main (single combined planning branch)`  
**Created**: 2026-03-11  
**Status**: Draft  
**Input**: User description: "Generate the project specification strictly from
the authoritative source documents already bound by the constitution."

**Authoritative Sources**: `Blend_Color_Game_User_Stories.md`,
`Blend_Colour_Game_Use_Cases_Scenarios_ATs.md`, `architecture_note.md`,
`coding-standard-python.md`, `coding-standard-frontend.md`

**Traceability Note**: Every requirement in this specification maps back to the
authoritative sources above. Behaviors not fully defined there are preserved as
`clarification required`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter the Game as an Authenticated or Guest Player (Priority: P1)

Players need to enter the system either through OAuth sign-in or guest access,
receive the correct identity handling, and manage session lifecycle without
invented account behaviors.

**Why this priority**: No gameplay flow is available until a player can enter
the system with the right identity and session state.

**Independent Test**: A player can complete OAuth sign-in or guest entry, reach
the game entry point, see the expected identity representation, and leave the
session safely.

**Acceptance Scenarios**:

1. **Given** the sign-in screen is available, **When** a player completes a
   supported OAuth sign-in flow, **Then** the system authenticates the player,
   links the OAuth identity to a unique user identity, creates an active
   signed-in session, and displays the signed-in identity in the lobby.
   `(Source: US-01, US-05, US-06, US-07, UC-01, UC-05, UC-06, UC-07)`
2. **Given** the game start screen is available, **When** a player selects
   guest play, **Then** the system creates a guest session, generates a
   temporary guest name, allows the guest to edit the display name before room
   entry, and expires the guest session after inactivity.
   `(Source: US-02, US-03, US-04, US-09, UC-02, UC-03, UC-04, UC-09)`
3. **Given** a player is signed in, **When** the player logs out, **Then** the
   authenticated session ends and the player loses signed-in access.
   `(Source: US-08, UC-08)`

---

### User Story 2 - Join a Room With a Valid Identity (Priority: P1)

Players need room entry to preserve identity clarity and continuity for room
participation.

**Why this priority**: Multiplayer room participation depends on unique room
identity and reconnect support.

**Independent Test**: Two players attempt room participation with room-level
identity rules enforced, and a disconnected player can rejoin the same room.

**Acceptance Scenarios**:

1. **Given** a room exists, **When** a player attempts to join using a display
   name already in use in that room, **Then** the system prevents duplicate
   display names within that room.
   `(Source: US-10, UC-10)`
2. **Given** a player disconnects from an active room, **When** the player
   reconnects, **Then** the system restores the player to the same room.
   `(Source: US-11, UC-11)`

---

### User Story 3 - Blend Colors Through the Play Interface (Priority: P1)

Players need to manipulate colors directly, preview outcomes, and stay inside
valid color boundaries.

**Why this priority**: The central game interaction is color blending.

**Independent Test**: A player can manipulate the blending interface from the
base colors through preview and reset without producing invalid values.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** a player opens the color-blending
   interface, **Then** the player receives the base colors for that round and
   can adjust values using sliders.
   `(Source: US-12, US-13, US-14, UC-12, UC-13, UC-14)`
2. **Given** the player is adjusting colors, **When** values change, **Then**
   the system shows real-time blended color updates, constrains values to valid
   ranges, and lets the player reset the selected colors.
   `(Source: US-15, US-16, US-17, UC-15, UC-16, UC-17)`
3. **Given** the player has blended a candidate color, **When** the player
   reviews the result before submitting, **Then** the system shows the final
   blended color preview.
   `(Source: US-18, UC-18)`

---

### User Story 4 - Compete Against a Target Color (Priority: P1)

Players need a visible target, objective scoring, and ranking feedback with a
deterministic tie-break rule.

**Why this priority**: Match outcomes depend on a shared target and objective
score calculation.

**Independent Test**: Multiple players receive the same target color, submit
colors, and receive closeness-based scoring, similarity percentage, and
rankings.

**Acceptance Scenarios**:

1. **Given** a new round begins, **When** the round is initialized, **Then**
   the system shows a target color and generates that target randomly for the
   round.
   `(Source: US-19, US-20, UC-19, UC-20)`
2. **Given** players submit colors for a round, **When** scoring occurs,
   **Then** the system calculates color distance, produces scores based on
   closeness to the target, shows similarity percentages, and ranks players by
   closeness.
   `(Source: US-21, US-22, US-23, US-24, UC-21, UC-22, UC-23, UC-24)`
3. **Given** two or more players produce tied results, **When** final rankings
   are determined, **Then** the system breaks the tie using exact unrounded
   color distance and presents that tie-breaking rule to players.
   `(Source: US-25, US-26, UC-25, UC-26)`

---

### User Story 5 - Complete Timed Rounds and Submit on Time (Priority: P1)

Players need clearly bounded round timing, visible countdowns, and distinct
submission acceptance behavior before and after expiry.

**Why this priority**: The round lifecycle controls fairness and pacing.

**Independent Test**: A timed round starts, counts down, accepts on-time
submissions, rejects late ones, and advances correctly.

**Acceptance Scenarios**:

1. **Given** a round begins, **When** the round becomes active, **Then** the
   system applies a time limit and displays a countdown timer.
   `(Source: US-27, US-28, UC-27, UC-28)`
2. **Given** the round timer is still active, **When** a player submits a
   blended color, **Then** the system accepts the submission for scoring.
   `(Source: US-30, UC-30)`
3. **Given** the round timer expires, **When** the round reaches time expiry,
   **Then** the system ends the round automatically and rejects any submission
   made after expiry.
   `(Source: US-29, US-31, UC-29, UC-31)`
4. **Given** a match contains multiple rounds, **When** a round ends,
   **Then** players can view round results before the next round begins.
   `(Source: US-32, US-33, UC-32, UC-33)`

---

### User Story 6 - Review Round Outcomes and Feedback (Priority: P1)

Players need post-round visibility into all results and comparative feedback.

**Why this priority**: The game depends on feedback between rounds for learning
and competition.

**Independent Test**: After a round is scored, players can inspect all
submitted colors, the winner, the target, and their own visual accuracy
feedback.

**Acceptance Scenarios**:

1. **Given** round scoring is complete, **When** results are published,
   **Then** players can see all submitted colors, the winning color and player,
   and the exact target color.
   `(Source: US-34, US-35, US-36, UC-34, UC-35, UC-36)`
2. **Given** a player views round results, **When** the system compares the
   player's result to the target, **Then** the player receives visual feedback
   showing how close the color was to the target.
   `(Source: US-37, UC-37)`

---

### User Story 7 - Participate in a Synchronized Multiplayer Match (Priority: P1)

Players need synchronized server-controlled multiplayer progression that keeps
all players on the same game state and handles player departures.

**Why this priority**: Multiplayer fairness depends on synchronized state and
server-controlled match progression.

**Independent Test**: Multiple players in a room receive the same game state,
the match starts only under the required conditions, and the game continues
through a player departure.

**Acceptance Scenarios**:

1. **Given** multiple players are in a room, **When** the system updates game
   state, **Then** all players receive the same authoritative game state.
   `(Source: US-38, UC-38, Architecture Note)`
2. **Given** a multiplayer room is waiting to start, **When** enough players
   have joined, **Then** the system starts the match; **and** single-player
   remains a distinct mode choice rather than a room-based multiplayer default.
   `(Source: US-39, US-43, UC-39, UC-43)`
3. **Given** a match is in progress, **When** a player leaves mid-round,
   **Then** the system handles the departure so remaining players can continue.
   `(Source: US-40, UC-40)`

---

### User Story 8 - Choose Between Single-Player Practice and Multiplayer Rooms (Priority: P1)

Players need a distinct mode choice between solo practice and room-based
competition.

**Why this priority**: The authoritative sources distinguish solo practice from
multiplayer room play.

**Independent Test**: A player can choose single-player or multiplayer, and a
single-player user can play against the system without joining a room.

**Acceptance Scenarios**:

1. **Given** the player is at mode selection, **When** the player chooses a
   mode, **Then** the system distinguishes single-player mode from multiplayer
   mode.
   `(Source: US-43, UC-43)`
2. **Given** the player chooses single-player mode, **When** solo play begins,
   **Then** the player plays against the system without joining a room.
   `(Source: US-44, UC-44)`
3. **Given** the player chooses multiplayer mode, **When** the player enters
   multiplayer play, **Then** the player creates or joins a game room.
   `(Source: US-45, UC-45)`

---

### User Story 9 - Operate and Close Multiplayer Rooms Correctly (Priority: P1)

Room-based play needs explicit host control, room visibility, and room closure
behavior.

**Why this priority**: Multiplayer rooms cannot function safely without host
governance.

**Independent Test**: A room host is identified, host-only deletion is
enforced, non-host deletion is blocked, and host departure closes the room.

**Acceptance Scenarios**:

1. **Given** a room exists, **When** players view room membership, **Then**
   the room host is clearly identified.
   `(Source: US-46, UC-46)`
2. **Given** a room host attempts room deletion, **When** the host issues the
   delete action, **Then** the system permits room deletion; **and given** a
   non-host attempts the same action, **Then** the system prevents room
   deletion.
   `(Source: US-47, US-48, UC-47, UC-48)`
3. **Given** the host leaves or deletes the room, **When** the room loses its
   host, **Then** the system closes the room automatically.
   `(Source: US-49, UC-49)`

---

### User Story 10 - Preserve Room and Identity Score History (Priority: P2)

Players need scoring history that stays distinct by room and by identity where
the source documents distinguish them.

**Why this priority**: History is a supported user-facing capability, but it is
secondary to core gameplay.

**Independent Test**: A player completes room rounds, reviews room history,
observes identity-linked history when signed in, and observes room-scoped guest
history for guest play.

**Acceptance Scenarios**:

1. **Given** rounds have been scored in a room, **When** the player reviews
   history in that room, **Then** the system stores and displays score history
   per room and allows viewing current-room progress round by round.
   `(Source: US-50, US-52, UC-50, UC-52)`
2. **Given** a signed-in player completes room play, **When** the player leaves
   the room, **Then** the room scoring history remains linked to the player's
   identity and persists after leaving.
   `(Source: US-51, US-53, UC-51, UC-53)`
3. **Given** a guest player completes room play, **When** the room ends,
   **Then** the guest scoring history exists only for the duration of that
   room.
   `(Source: US-54, UC-54)`

---

### User Story 11 - See Submission Status and Receive Submission Confirmation (Priority: P2)

Players need visibility into round progress before scoring completes.

**Why this priority**: Submission awareness improves confidence and social
awareness during active rounds.

**Independent Test**: During a round, players can tell who has submitted, who
has not, the order of submissions, and whether their own submission was
received.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** players monitor progress, **Then**
   they can see which players have already submitted and which players have not
   yet submitted.
   `(Source: US-55, US-56, UC-55, UC-56)`
2. **Given** players are submitting during a round, **When** submissions are
   accepted, **Then** players can see submission order and each player receives
   a clear indication when their submission is received.
   `(Source: US-57, US-58, UC-57, UC-58)`

---

### User Story 12 - Interact Socially Around Submissions (Priority: P3)

Players need lightweight, safe social interaction around round results.

**Why this priority**: Social features add value after core entry, gameplay,
and room management are in place.

**Independent Test**: Players can upvote or highlight submissions, identify the
crowd favorite, and send preset messages.

**Acceptance Scenarios**:

1. **Given** players are viewing submissions, **When** a player chooses to
   react to a submission, **Then** the player can upvote or highlight an
   interesting submission and the system can identify the crowd favorite.
   `(Source: US-59, US-60, UC-59, UC-60)`
2. **Given** players want to communicate during play or results review,
   **When** a player selects a social message, **Then** the player can send a
   short preset message.
   `(Source: US-61, UC-61)`

### Edge Cases

- OAuth sign-in can be cancelled, rejected, or fail validation, and the player
  remains unauthenticated. `(Source: UC-01)`
- Guest play can be disabled or fail during guest identity or session creation.
  `(Source: UC-02)`
- Guest display name editing happens before room join, not after room entry.
  `(Source: UC-04)`
- Duplicate display names are prevented within a room, not globally.
  `(Source: US-10, UC-10)`
- A player can disconnect and reconnect to the same room while preserving room
  participation. `(Source: US-11, UC-11)`
- Submissions after timer expiry are rejected instead of accepted for later
  scoring. `(Source: US-31, UC-31)`
- A player leaving mid-round does not force the remaining players to stop.
  `(Source: US-40, UC-40)`
- The room host is the only actor allowed to delete a room, and the room closes
  automatically when the host leaves or deletes it. `(Source: US-47, US-48,
  US-49, UC-47, UC-48, UC-49)`
- Single-player mode and multiplayer room play remain distinct user flows.
  `(Source: US-43, US-44, US-45, UC-43, UC-44, UC-45)`
- Ties are resolved using exact unrounded color distance.
  `(Source resolution from clarification for US-25 and US-26)`
- When a match has started and the lobby is locked, a late joiner enters the
  room immediately in a waiting state until the next game begins.
  `(Source resolution from clarification for US-41 and US-42)`
- No transition is allowed between room-based multiplayer flow and
  single-player mode; the player must leave the room before starting
  single-player.
  `(Source resolution from clarification for US-39, US-43, and US-44)`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a player to sign in using OAuth 2.0 so the
  player can access the game without creating a new password. `(Source: US-01,
  UC-01)`
- **FR-002**: The system MUST allow a player to play as a guest without logging
  in. `(Source: US-02, UC-02)`
- **FR-003**: The system MUST generate a temporary guest name for a guest
  player. `(Source: US-03, UC-03)`
- **FR-004**: The system MUST allow a guest player to edit the display name
  before joining a room. `(Source: US-04, UC-04)`
- **FR-005**: The system MUST show a signed-in player's display name and
  profile avatar in the lobby. `(Source: US-05, UC-05)`
- **FR-006**: The system MUST link a signed-in player's OAuth identity to a
  unique user identity. `(Source: US-06, UC-06)`
- **FR-007**: The system MUST keep a signed-in player's session active for a
  period of time. `(Source: US-07, UC-07)`
- **FR-008**: The system MUST allow a player to log out. `(Source: US-08,
  UC-08)`
- **FR-009**: The system MUST expire a guest player's session automatically
  after inactivity. `(Source: US-09, UC-09)`
- **FR-010**: The system MUST prevent duplicate display names within the same
  room. `(Source: US-10, UC-10)`
- **FR-011**: The system MUST support reconnecting the same guest or signed-in
  player to the same room after a disconnect. `(Source: US-11, UC-11)`
- **FR-012**: The system MUST provide a color-blending panel for interactive
  color mixing. `(Source: US-12, UC-12)`
- **FR-013**: The system MUST provide all players with the same base colors for
  a round. `(Source: US-13, UC-13, Architecture Note)`
- **FR-014**: The system MUST allow color adjustment using sliders. `(Source:
  US-14, UC-14)`
- **FR-015**: The system MUST update blended colors in real time while the
  player adjusts values. `(Source: US-15, UC-15)`
- **FR-016**: The system MUST allow a player to reset selected colors. `(Source:
  US-16, UC-16)`
- **FR-017**: The system MUST keep color values within valid ranges. `(Source:
  US-17, UC-17)`
- **FR-018**: The system MUST let a player preview the final blended color
  before submission. `(Source: US-18, UC-18)`
- **FR-019**: The system MUST show a target color for each round. `(Source:
  US-19, UC-19)`
- **FR-020**: The system MUST generate the target color randomly. `(Source:
  US-20, UC-20)`
- **FR-021**: The system MUST calculate the distance between a submitted color
  and the target color. `(Source: US-21, UC-21)`
- **FR-022**: The system MUST make the score reflect how close the submitted
  color is to the target color. `(Source: US-22, UC-22)`
- **FR-023**: The system MUST show a similarity percentage for the player's
  result. `(Source: US-23, UC-23)`
- **FR-024**: The system MUST rank players by closeness to the target color.
  `(Source: US-24, UC-24)`
- **FR-025**: The system MUST resolve score ties using a clear and consistent
  rule by comparing exact unrounded color distance. `(Source: US-25, UC-25;
  clarification applied)`
- **FR-026**: The system MUST make the tie-breaking rule visible or explained
  to players, including that exact unrounded color distance is used to break
  ties. `(Source: US-26, UC-26; clarification applied)`
- **FR-027**: The system MUST enforce a time limit for each round. `(Source:
  US-27, UC-27)`
- **FR-028**: The system MUST show a countdown timer during the round. `(Source:
  US-28, UC-28)`
- **FR-029**: The system MUST end the round automatically when time expires.
  `(Source: US-29, UC-29)`
- **FR-030**: The system MUST allow a player to submit a blended color before
  the timer ends. `(Source: US-30, UC-30)`
- **FR-031**: The system MUST reject submissions made after the round timer
  expires. `(Source: US-31, UC-31)`
- **FR-032**: The system MUST support multiple rounds in a match. `(Source:
  US-32, UC-32)`
- **FR-033**: The system MUST let players view round results before the next
  round begins. `(Source: US-33, UC-33)`
- **FR-034**: The system MUST show all submitted colors after a round. `(Source:
  US-34, UC-34)`
- **FR-035**: The system MUST highlight the winning color or winning player.
  `(Source: US-35, UC-35)`
- **FR-036**: The system MUST show the exact target color after scoring.
  `(Source: US-36, UC-36)`
- **FR-037**: The system MUST provide visual feedback showing how close the
  player's color was to the target. `(Source: US-37, UC-37)`
- **FR-038**: The system MUST provide the same authoritative game state to all
  players in multiplayer play. `(Source: US-38, UC-38, Architecture Note)`
- **FR-039**: The system MUST start multiplayer play only when enough players
  have joined a room. `(Source: US-39, UC-39)`
- **FR-040**: The system MUST handle a player leaving mid-round so other
  players can continue playing. `(Source: US-40, UC-40)`
- **FR-041**: The system MUST lock the lobby against new players joining once a
  game starts while preserving late joiners as waiting participants rather than
  active match participants. `(Source: US-41, UC-41; clarification applied)`
- **FR-042**: The system MUST place players who join after a game has started
  into the room immediately in a waiting state until the next game begins.
  `(Source: US-42, UC-42; clarification applied)`
- **FR-043**: The system MUST allow a player to choose between single-player
  mode and multiplayer mode. `(Source: US-43, UC-43)`
- **FR-044**: The system MUST allow a single-player user to play against the
  system without joining a room. `(Source: US-44, UC-44)`
- **FR-045**: The system MUST allow a multiplayer player to create or join a
  game room. `(Source: US-45, UC-45)`
- **FR-046**: The system MUST clearly identify the room host. `(Source: US-46,
  UC-46)`
- **FR-047**: The system MUST allow only the room host to delete the room.
  `(Source: US-47, UC-47)`
- **FR-048**: The system MUST prevent a non-host player from deleting the room.
  `(Source: US-48, UC-48)`
- **FR-049**: The system MUST automatically close the room when the host leaves
  or deletes it. `(Source: US-49, UC-49)`
- **FR-050**: The system MUST store scoring history per room. `(Source: US-50,
  UC-50)`
- **FR-051**: The system MUST link scores to the player's user identity where
  the player is signed in. `(Source: US-51, UC-51)`
- **FR-052**: The system MUST allow a player to view score history within the
  current room. `(Source: US-52, UC-52)`
- **FR-053**: The system MUST preserve room scoring history after leaving for a
  signed-in player. `(Source: US-53, UC-53)`
- **FR-054**: The system MUST keep guest scoring history only for the duration
  of the room. `(Source: US-54, UC-54)`
- **FR-055**: The system MUST show which players have already submitted their
  color. `(Source: US-55, UC-55)`
- **FR-056**: The system MUST show which players have not yet submitted their
  color. `(Source: US-56, UC-56)`
- **FR-057**: The system MUST show the order in which players submit their
  colors. `(Source: US-57, UC-57)`
- **FR-058**: The system MUST give a clear indication that a submission was
  received. `(Source: US-58, UC-58)`
- **FR-059**: The system MUST allow a player to upvote or highlight interesting
  submissions. `(Source: US-59, UC-59)`
- **FR-060**: The system MUST show which submission was the crowd favorite.
  `(Source: US-60, UC-60)`
- **FR-061**: The system MUST allow a player to send short preset messages.
  `(Source: US-61, UC-61)`

### Key Entities *(include if feature involves data)*

- **Player Identity**: Represents a guest or signed-in player identity, along
  with display-name and identity linkage status. `(Source: US-01 to US-11,
  UC-01 to UC-11)`
- **Session**: Represents an authenticated or guest play session with entry,
  activity, logout, expiry, and reconnect behavior. `(Source: US-02, US-07,
  US-08, US-09, US-11, UC-02, UC-07, UC-08, UC-09, UC-11)`
- **Room**: Represents a multiplayer play space with membership, host control,
  join restrictions, waiting behavior, and closure rules. `(Source: US-10,
  US-38 to US-49, UC-10, UC-38 to UC-49, Architecture Note)`
- **Match**: Represents a multi-round play session with start conditions,
  synchronization, and lifecycle progression. `(Source: US-27 to US-33,
  US-38 to US-45, UC-27 to UC-45, Architecture Note)`
- **Round**: Represents a timed gameplay interval with a target color,
  submissions, scoring, and results. `(Source: US-19 to US-37, US-55 to US-58,
  UC-19 to UC-37, UC-55 to UC-58)`
- **Submission**: Represents a player's blended color entry, acceptance status,
  submission order, and related feedback. `(Source: US-30, US-31, US-34,
  US-55 to US-60, UC-30, UC-31, UC-34, UC-55 to UC-60)`
- **Score Record**: Represents closeness, similarity, ranking, and tie-related
  outcome data for a round. `(Source: US-21 to US-26, US-50 to US-54, UC-21 to
  UC-26, UC-50 to UC-54)`
- **Score History**: Represents room-scoped and identity-linked scoring history
  as distinct history views. `(Source: US-50 to US-54, UC-50 to UC-54)`
- **Social Interaction**: Represents upvotes, crowd-favorite recognition, and
  preset-message interactions around submissions. `(Source: US-59 to US-61,
  UC-59 to UC-61)`

## Assumptions and Clarifications

- No requirements beyond the authoritative source documents are introduced in
  this specification.
- Server authority over gameplay state, room state, scoring, ranking, and match
  transitions is treated as mandatory across all multiplayer flows. `(Source:
  architecture_note.md, Constitution)`
- The open clarification items for tie-breaking, late-join room admission, and
  multiplayer-to-single-player transitions have been resolved for this
  specification and are reflected in `Edge Cases` and `Functional Requirements`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can enter the game through both supported entry paths:
  OAuth sign-in and guest access, with each path completing its documented
  identity and session outcomes. `(Source: US-01 to US-09, UC-01 to UC-09)`
- **SC-002**: In every multiplayer round, all active players receive the same
  round target, base colors, and authoritative game-state progression. `(Source:
  US-13, US-19, US-38, UC-13, UC-19, UC-38, Architecture Note)`
- **SC-003**: Every completed round produces all documented outcome views:
  submission acceptance status, scoring, similarity percentage, ranking, all
  submitted colors, winner highlighting, exact target color, and visual
  feedback. `(Source: US-21 to US-37, US-55 to US-58, UC-21 to UC-37, UC-55 to
  UC-58)`
- **SC-004**: Multiplayer room play enforces the documented governance rules in
  all applicable cases: minimum-player start validation, host identification,
  host-only room deletion, automatic room closure on host exit, and distinct
  handling for late joiners once a match has started. `(Source: US-39, US-41 to
  US-49, UC-39, UC-41 to UC-49)`
- **SC-005**: History views remain distinct in all documented cases: room
  history is viewable within the current room, signed-in player room history
  persists after leaving, and guest room history does not persist beyond the
  room duration. `(Source: US-50 to US-54, UC-50 to UC-54)`
