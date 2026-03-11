# Realtime Interface Contract

This contract records the WebSocket-driven behaviors required for authoritative
room and match synchronization. It intentionally names message categories by
behavior rather than inventing concrete event identifiers or payload schemas.

## Channel Scope

- **Purpose**: Synchronize room membership, round progression, timers,
  submissions, scoring, results, and waiting-state updates.
- **Authority Rule**: The backend server is the source of truth for all
  realtime gameplay state.

## Event Group: Room Synchronization

### Room State Update

- **Required Behavior**:
  - publish authoritative room membership and room status changes
  - reflect host identity and room closure

### Player Join and Leave Update

- **Required Behavior**:
  - inform connected room members when players join, disconnect, reconnect, or
    leave
  - preserve late joiners as waiting participants during an active match

## Event Group: Match and Round Lifecycle

### Match Start Update

- **Required Behavior**:
  - notify room members when multiplayer start conditions are satisfied and the
    match begins

### Round Start Update

- **Required Behavior**:
  - publish the round start
  - provide the target color and shared base colors for the round

### Timer Update

- **Required Behavior**:
  - publish countdown progress during the active round
  - close submissions when the timer expires

## Event Group: Submission and Scoring

### Submission Receipt Update

- **Required Behavior**:
  - confirm accepted submissions to the submitting player
  - expose which players have submitted, which have not, and submission order

### Submission Rejection Update

- **Required Behavior**:
  - reject submissions received after the timer expires

### Scoring Update

- **Required Behavior**:
  - publish closeness-based scoring, similarity percentage, and ranking
  - break ties using exact unrounded color distance

## Event Group: Results and Social Updates

### Result Publication

- **Required Behavior**:
  - publish all submitted colors
  - highlight the winning color or player
  - reveal the exact target color
  - publish visual feedback on closeness to the target

### Social Interaction Update

- **Required Behavior**:
  - publish reactions needed to determine interesting submissions and the crowd
    favorite
  - distribute preset-message activity to connected participants

## Reliability Rules

- Realtime updates must reflect server-controlled state transitions only.
- Frontend clients must render and react to realtime updates but must not
  authoritatively decide timers, scoring, ranking, or room transitions.
