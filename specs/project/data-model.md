# Data Model: Blend Colour Game

## Entity: PlayerIdentity

- **Purpose**: Represents a signed-in or guest player participating in the
  system.
- **Fields**:
  - `playerId`: unique player identifier
  - `identityType`: `authenticated` or `guest`
  - `displayName`: player-visible name
  - `profileAvatar`: signed-in profile avatar when available
  - `oauthIdentity`: linked OAuth identity for authenticated players
- **Validation Rules**:
  - `displayName` must be unique within a room
  - guest players may edit `displayName` before room join
  - authenticated players link to exactly one unique user identity
- **Relationships**:
  - has one or more `Session` records over time
  - may have many `RoomMembership` records
  - may have many `ScoreRecord` and `ScoreHistoryEntry` records

## Entity: Session

- **Purpose**: Tracks guest or authenticated access to the game.
- **Fields**:
  - `sessionId`
  - `playerId`
  - `sessionType`: `authenticated` or `guest`
  - `status`: active, expired, logged_out
  - `lastActivityAt`
- **Validation Rules**:
  - guest sessions expire after inactivity
  - logout transitions an authenticated session to `logged_out`
- **Relationships**:
  - belongs to one `PlayerIdentity`

## Entity: Room

- **Purpose**: Represents a multiplayer room used for room-based play.
- **Fields**:
  - `roomId`
  - `hostPlayerId`
  - `roomStatus`: open, active_match, closed
  - `joinPolicy`: open or locked_for_active_match
  - `waitingPolicy`: late_join_waiting_allowed
- **Validation Rules**:
  - only the host may delete the room
  - non-host players cannot delete the room
  - the room closes automatically when the host leaves or deletes it
- **Relationships**:
  - has many `RoomMembership` records
  - may have many `Match` records over time
  - has many `ScoreHistoryEntry` records scoped to the room

## Entity: RoomMembership

- **Purpose**: Tracks a player's participation state within a room.
- **Fields**:
  - `roomMembershipId`
  - `roomId`
  - `playerId`
  - `membershipStatus`: active, disconnected, waiting_for_next_game
  - `joinedAt`
- **Validation Rules**:
  - duplicate `displayName` values are not allowed within the same room
  - disconnected members may reconnect to the same room
  - late joiners entering during an active match start in
    `waiting_for_next_game`
- **Relationships**:
  - belongs to one `Room`
  - belongs to one `PlayerIdentity`

## Entity: Match

- **Purpose**: Represents a single-player session or a multiplayer match made
  up of multiple rounds.
- **Fields**:
  - `matchId`
  - `mode`: single_player or multiplayer
  - `roomId`: present for multiplayer room play
  - `matchStatus`: waiting_for_players, active_round, scoring, results, ended
  - `currentRoundNumber`
- **Validation Rules**:
  - multiplayer matches start only when enough players have joined
  - single-player is a distinct mode and does not begin from an existing room
    without leaving that room first
- **Relationships**:
  - may belong to one `Room`
  - has many `Round` records

## Entity: Round

- **Purpose**: Represents one timed color-matching competition unit.
- **Fields**:
  - `roundId`
  - `matchId`
  - `roundNumber`
  - `targetColor`
  - `baseColorSet`
  - `timeLimit`
  - `roundStatus`: active_blending, submission_closed, scoring, results
- **Validation Rules**:
  - `targetColor` is generated randomly for the round
  - all players in the same round receive the same `baseColorSet`
  - the round ends automatically when the timer expires
- **Relationships**:
  - belongs to one `Match`
  - has many `Submission` records
  - has many `ScoreRecord` records

## Entity: Submission

- **Purpose**: Represents a player's blended-color submission for a round.
- **Fields**:
  - `submissionId`
  - `roundId`
  - `playerId`
  - `blendedColor`
  - `submittedAt`
  - `submissionStatus`: accepted, rejected_late
  - `submissionOrder`
- **Validation Rules**:
  - color values must stay within valid ranges
  - submissions after timer expiry are rejected
  - accepted submissions receive confirmation
- **Relationships**:
  - belongs to one `Round`
  - belongs to one `PlayerIdentity`
  - yields one `ScoreRecord` when accepted

## Entity: ScoreRecord

- **Purpose**: Stores round-level scoring outcomes for a player.
- **Fields**:
  - `scoreRecordId`
  - `roundId`
  - `playerId`
  - `colorDistance`
  - `score`
  - `similarityPercentage`
  - `rank`
  - `tieBreakBasis`: exact_unrounded_color_distance
- **Validation Rules**:
  - score reflects closeness to the target color
  - rank is based on closeness
  - ties are broken using exact unrounded color distance
- **Relationships**:
  - belongs to one `Round`
  - belongs to one `PlayerIdentity`

## Entity: ScoreHistoryEntry

- **Purpose**: Provides room-scoped and identity-linked score history views.
- **Fields**:
  - `scoreHistoryEntryId`
  - `roomId`
  - `playerId`
  - `roundId`
  - `scoreRecordId`
  - `historyScope`: room_scoped or identity_scoped
- **Validation Rules**:
  - room score history is separated by room
  - signed-in players retain room scoring history after leaving
  - guest score history exists only for the duration of the room
- **Relationships**:
  - belongs to one `Room`
  - belongs to one `PlayerIdentity`
  - references one `ScoreRecord`

## Entity: SocialInteraction

- **Purpose**: Represents lightweight social responses around submissions.
- **Fields**:
  - `socialInteractionId`
  - `roundId`
  - `playerId`
  - `interactionType`: upvote, highlight, preset_message
  - `targetSubmissionId`
  - `presetMessage`
- **Validation Rules**:
  - preset messages are limited to approved short messages
  - crowd favorite derives from recorded social reactions
- **Relationships**:
  - belongs to one `Round`
  - belongs to one `PlayerIdentity`
  - may target one `Submission`

## State Transitions

### Room

- `open` -> `active_match`: enough players join and a multiplayer match starts
- `active_match` -> `open`: match ends and the room becomes available for the
  next game
- `open` or `active_match` -> `closed`: host leaves or deletes the room

### Room Membership

- `active` -> `disconnected`: player disconnects
- `disconnected` -> `active`: same player reconnects to the same room
- `waiting_for_next_game` -> `active`: next game begins and the waiting player
  becomes active

### Match

- `waiting_for_players` -> `active_round`: match start conditions are met
- `active_round` -> `scoring`: timer expires or round submissions close
- `scoring` -> `results`: ranking and result publication complete
- `results` -> `active_round`: next round begins
- `results` -> `ended`: final round completes

### Round

- `active_blending` -> `submission_closed`: timer expires
- `submission_closed` -> `scoring`: accepted submissions are evaluated
- `scoring` -> `results`: rankings and feedback are published
