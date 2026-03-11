# Quickstart Validation: Blend Colour Game

Use this walkthrough to validate the planned system behavior before task
generation. The steps below mirror the authoritative requirements and the
project specification.

## 1. Validate Player Entry

1. Start the system and open the game entry screen.
2. Verify that a player can:
   - sign in through OAuth and receive signed-in identity presentation
   - start as a guest and receive a temporary guest identity
   - edit a guest display name before joining a room
   - log out from a signed-in session

## 2. Validate Mode Selection

1. Verify that the player can choose between single-player and multiplayer.
2. Verify that single-player starts against the system without joining a room.
3. Verify that multiplayer requires room creation or room join.

## 3. Validate Room Governance

1. Create a multiplayer room and verify that the host is identified.
2. Join the room with another player and verify duplicate display names are not
   allowed within that room.
3. Attempt room deletion as a non-host and verify it is prevented.
4. Delete the room as host or leave as host and verify the room closes.

## 4. Validate Realtime Match Progression

1. Start a multiplayer match with enough players.
2. Verify all active players receive:
   - the same target color
   - the same base colors
   - synchronized round and timer updates
3. Verify that late joiners enter the room in waiting state during the active
   match.
4. Verify that disconnected players can reconnect to the same room.

## 5. Validate Round Play and Scoring

1. Blend colors using sliders, observe real-time preview, and reset selections.
2. Submit a blended color before timer expiry and verify the submission is
   accepted and acknowledged.
3. Attempt a submission after timer expiry and verify it is rejected.
4. Verify results publication shows:
   - all submitted colors
   - winning color or player
   - exact target color
   - similarity percentage
   - ranking with ties broken by exact unrounded color distance
   - visual closeness feedback

## 6. Validate History and Social Interaction

1. Verify score history is visible within the current room.
2. Verify signed-in player room history persists after leaving the room.
3. Verify guest score history is limited to the room duration.
4. Verify players can:
   - see who has submitted and who has not
   - see submission order
   - upvote or highlight submissions
   - identify the crowd favorite
   - send preset messages
