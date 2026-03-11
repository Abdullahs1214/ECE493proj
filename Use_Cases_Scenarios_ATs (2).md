# UC-01 — Sign In with OAuth 2.0

## Source User Story
**US-01**: As a player, I want to sign in using OAuth 2.0 (e.g., Google/GitHub) so that I can access the game without creating a new password.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to sign in to the Blend Colour game using an OAuth 2.0 provider so they can access the game without creating a new password.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: OAuth Provider (Google/GitHub), Game Account Database, Authentication Service  
**Trigger**: The player selects a “Sign in with Google” or “Sign in with GitHub” option.

### Success End Condition
* The player is authenticated, an account is created or linked if needed, and the player can access the game.

### Failed End Condition
* The player is not authenticated and cannot access signed-in game features.

### Preconditions
* The game sign-in screen is available.
* The OAuth provider sign-in service is reachable.

### Main Success Scenario
1. The player selects “Sign in with Google” or “Sign in with GitHub”.
2. The system redirects the player to the chosen OAuth provider’s authentication page.
3. The player enters valid credentials with the OAuth provider and grants permission to share basic identity information.
4. The OAuth provider returns an authorization result to the system.
5. The system validates the returned OAuth information and retrieves the player’s verified identity details.
6. The system checks whether a game account is already linked to that OAuth identity.
7. The system creates a new game account or links the OAuth identity to an existing account, then stores or updates the account record in the game account database.
8. The system creates an authenticated session and redirects the player to the game home screen.

### Extensions
* **3a**: The player cancels or denies permission at the OAuth provider.  
  * **3a1**: The system returns the player to the sign-in screen and displays a message indicating sign-in was cancelled or not authorized.
* **4a**: The OAuth provider returns an error or does not return a valid authorization result.  
  * **4a1**: The system displays an error message indicating sign-in failed and prompts the player to try again.
* **5a**: The system cannot validate the OAuth result or cannot retrieve identity details.  
  * **5a1**: The system displays an error message indicating authentication could not be verified and prompts the player to try again.
* **7a**: The system cannot create or update the account due to a database or server error.  
  * **7a1**: The system displays an error message indicating sign-in failed due to a system issue and advises the player to try again later.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact set of identity fields required from the OAuth provider and the account-linking rules are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player opens the Blend Colour game and decides to sign in using an OAuth provider so they do not need to create a new password. The player selects **Sign in with Google** or **Sign in with GitHub**, and the system redirects them to the chosen provider’s sign-in page.

The player enters valid provider credentials and grants permission for the game to access basic identity information. The OAuth provider returns an authorization result to the game system, and the system validates the returned information and retrieves the player’s verified identity details.

The system checks whether the OAuth identity is already linked to a game account. If it is not linked, the system creates a new account or links the identity to an existing account, then stores the updated account record in the game account database. The system creates an authenticated session and redirects the player to the game home screen.

### Alternative Scenario 3a — Player Cancels or Denies Permission
The player selects an OAuth sign-in option and is redirected to the provider’s authentication page. Instead of completing sign-in, the player cancels the flow or denies the requested permissions.

The system receives the cancellation result and returns the player to the game sign-in screen. The system displays a message indicating that sign-in was cancelled or not authorized. The player is not signed in, and no account changes are made.

### Alternative Scenario 4a — OAuth Provider Error or Missing Authorization Result
The player attempts to sign in with an OAuth provider and completes the provider interaction. The OAuth provider returns an error, or the system does not receive a valid authorization result.

The system detects that sign-in did not complete successfully. The system displays an error message indicating that OAuth sign-in failed and prompts the player to try again. The player remains unauthenticated.

### Alternative Scenario 5a — OAuth Result Cannot Be Verified
The player completes the OAuth provider sign-in and authorization steps. The provider returns a result, but the system cannot validate it or cannot retrieve the required identity details.

The system treats the sign-in attempt as unverified. The system displays an error message indicating that authentication could not be verified and prompts the player to try again. The player remains unauthenticated, and no account is created or linked.

### Alternative Scenario 7a — System or Database Error During Account Creation or Linking
The player completes OAuth authentication successfully, and the system validates the identity information. The system then attempts to create a new game account or link the OAuth identity to an existing account.

During account creation or linking, the system encounters a database or server error and cannot store the account update. The system displays an error message indicating sign-in failed due to a system issue and advises the player to try again later. The player is not signed in.

---

## Acceptance Test Suite

### AT-UC-01-01 — Successful OAuth Sign-In
**Covers**: Main Success Scenario

- **Given** the sign-in screen is available  
- **When** the player completes OAuth sign-in with a supported provider using valid credentials and grants permission  
- **Then** the system authenticates the player  
  **And** creates or links the game account record in the database  
  **And** redirects the player to the game home screen

### AT-UC-01-02 — Player Cancels or Denies Permission
**Covers**: Extension 3a

- **Given** the player is on the OAuth provider authentication page  
- **When** the player cancels the flow or denies permission  
- **Then** the system returns the player to the sign-in screen  
  **And** displays a cancellation or authorization-denied message  
  **And** no authenticated session is created

### AT-UC-01-03 — OAuth Provider Error or Missing Authorization Result
**Covers**: Extension 4a

- **Given** the player initiates OAuth sign-in with a supported provider  
- **When** the OAuth provider returns an error or the system does not receive a valid authorization result  
- **Then** the system displays an OAuth sign-in failure message  
  **And** no authenticated session is created

### AT-UC-01-04 — OAuth Result Cannot Be Verified
**Covers**: Extension 5a

- **Given** the OAuth provider returns an authorization result  
- **When** the system cannot validate the OAuth result or cannot retrieve required identity details  
- **Then** the system displays an authentication verification failure message  
  **And** no authenticated session is created  
  **And** no account is created or linked

### AT-UC-01-05 — System or Database Failure During Account Linking
**Covers**: Extension 7a

- **Given** the player’s OAuth identity is successfully validated  
- **When** the system fails while creating or updating the linked game account record  
- **Then** the system displays a system failure message  
  **And** no authenticated session is created

### AT-UC-01-06 — No Partial Account Link
**Covers**: All failure paths

- **Given** an OAuth sign-in attempt fails at authorization, verification, or storage  
- **Then** no partial or unusable account link exists in the system

### AT-UC-01-07 — OAuth Sign-In Grants Access
**Covers**: Success End Condition

- **Given** a player successfully signs in using OAuth  
- **When** the player enters the game home screen  
- **Then** the player is treated as authenticated for signed-in game features

---

*UC-01 status: COMPLETE*

# UC-02 — Play as Guest

## Source User Story
**US-02**: As a player, I want to play as a guest without logging in so that I can try the game quickly.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to access and play the Blend Colour game as a guest without requiring authentication so they can try the game quickly.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Game Session Manager, Game State Store  
**Trigger**: The player selects the “Play as Guest” option on the game start screen.

### Success End Condition
* A guest session is created and the player can access and play the game with guest-level features.

### Failed End Condition
* No guest session is created, and the player cannot access the game.

### Preconditions
* The game start screen is available.
* Guest play is enabled by the system configuration.

### Main Success Scenario
1. The player selects the “Play as Guest” option.
2. The system generates a temporary guest identity.
3. The system creates a guest game session associated with the temporary identity.
4. The system initializes default game state for the guest session.
5. The system grants the player access to the game with guest-level features.
6. The system directs the player to the game lobby or first game screen.

### Extensions
* **1a**: Guest play is disabled by system configuration.  
  * **1a1**: The system displays a message indicating that guest play is unavailable and prompts the player to sign in instead.
* **2a**: The system cannot generate a temporary guest identity.  
  * **2a1**: The system displays an error message indicating that a guest session could not be created and advises the player to try again.
* **3a**: The system cannot create a guest session due to a server or storage error.  
  * **3a1**: The system displays an error message indicating that the game could not be started and advises the player to try again later.

### Related Information
* **Priority**: High  
* **Frequency**: Medium  
* **Open Issues**: The exact limitations of guest-level features compared to signed-in users are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player launches the Blend Colour game and wants to try it quickly without creating or signing into an account. On the start screen, the player selects the **Play as Guest** option.

The system generates a temporary guest identity and creates a new guest session. The system initializes the default game state associated with the guest session and enables guest-level features. The player is then directed to the game lobby or first game screen and can begin playing immediately.

### Alternative Scenario 1a — Guest Play Disabled
The player selects the **Play as Guest** option from the start screen. The system determines that guest play is currently disabled by configuration.

The system displays a message indicating that guest play is unavailable and prompts the player to sign in using a supported sign-in method. No guest session is created.

### Alternative Scenario 2a — Guest Identity Generation Failure
The player selects the **Play as Guest** option. The system attempts to generate a temporary guest identity but encounters an error.

The system displays an error message indicating that a guest session could not be created and advises the player to try again. The player does not enter the game.

### Alternative Scenario 3a — System or Server Error During Guest Session Creation
The player selects the **Play as Guest** option, and the system successfully generates a temporary guest identity. While creating the guest session, the system encounters a server or storage error.

The system displays an error message indicating that the game could not be started due to a system issue and advises the player to try again later. No guest session is created.

---

## Acceptance Test Suite

### AT-UC-02-01 — Successful Guest Play
**Covers**: Main Success Scenario

- **Given** the game start screen is available  
- **When** the player selects the “Play as Guest” option  
- **Then** the system creates a temporary guest identity  
  **And** creates a guest game session  
  **And** grants access to the game with guest-level features

### AT-UC-02-02 — Guest Play Disabled
**Covers**: Extension 1a

- **Given** guest play is disabled by system configuration  
- **When** the player selects the “Play as Guest” option  
- **Then** the system displays a guest-play-unavailable message  
  **And** no guest session is created

### AT-UC-02-03 — Guest Identity Generation Failure
**Covers**: Extension 2a

- **Given** the game start screen is available  
- **When** the system fails to generate a temporary guest identity  
- **Then** the system displays a guest session creation error  
  **And** no guest session is created

### AT-UC-02-04 — Guest Session Creation Failure
**Covers**: Extension 3a

- **Given** a temporary guest identity is generated  
- **When** the system fails while creating the guest session  
- **Then** the system displays a game start failure message  
  **And** no guest session is created

### AT-UC-02-05 — No Partial Guest Session
**Covers**: All failure paths

- **Given** an attempt to start guest play fails  
- **Then** no partial or unusable guest session exists in the system

### AT-UC-02-06 — Guest Access Is Restricted
**Covers**: Success End Condition

- **Given** a player is playing as a guest  
- **When** the player accesses game features  
- **Then** the system enforces guest-level feature restrictions

---

*UC-02 status: COMPLETE*

# UC-03 — Generate Temporary Guest Name

## Source User Story
**US-03**: As a guest player, I want the system to generate a temporary guest name so that I can be identified during a match.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a guest player to be assigned a temporary display name so they can be uniquely identified during a game session.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Guest Player  
**Secondary Actors**: Name Generation Service, Game Session Manager  
**Trigger**: A guest player enters a game session without a predefined display name.

### Success End Condition
* A unique temporary guest name is generated, assigned to the guest player, and visible to other players during the match.

### Failed End Condition
* No guest name is assigned, and the guest player cannot be identified during the match.

### Preconditions
* The player is participating as a guest.
* A guest game session has been created.

### Main Success Scenario
1. A guest player enters a game session.
2. The system detects that the guest player does not have a display name.
3. The system generates a temporary guest name.
4. The system verifies that the generated guest name is unique within the game session.
5. The system assigns the temporary guest name to the guest player.
6. The system displays the temporary guest name to all players in the match.

### Extensions
* **3a**: The system fails to generate a guest name.  
  * **3a1**: The system displays an error message indicating that a guest name could not be generated and prevents the match from starting.
* **4a**: The generated guest name is not unique within the game session.  
  * **4a1**: The system generates a new guest name and repeats the uniqueness check.
* **5a**: The system fails to assign the guest name due to a server or session error.  
  * **5a1**: The system displays an error message indicating that the guest name could not be assigned and prevents the match from starting.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The naming format and length of temporary guest names are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A guest player joins a Blend Colour game session without logging in. When the player enters the session, the system detects that no display name is associated with the guest.

The system generates a temporary guest name and checks that it is unique within the current game session. Once verified, the system assigns the temporary name to the guest player and displays it to all players in the match so the guest can be identified during gameplay.

### Alternative Scenario 3a — Guest Name Generation Failure
A guest player enters a game session, and the system attempts to generate a temporary guest name. The name generation process fails due to an internal error.

The system displays an error message indicating that a guest name could not be generated and prevents the match from starting. The guest player cannot proceed until the issue is resolved.

### Alternative Scenario 4a — Generated Name Not Unique
The system generates a temporary guest name for a guest player but detects that the name is already in use within the game session.

The system generates a new guest name and repeats the uniqueness check until a unique name is produced. Once a unique name is found, the system assigns it to the guest player and allows the match to proceed.

### Alternative Scenario 5a — Failure During Name Assignment
The system successfully generates a unique temporary guest name. While assigning the name to the guest player’s session, the system encounters a server or session error.

The system displays an error message indicating that the guest name could not be assigned and prevents the match from starting. The guest player is not allowed to proceed into the match.

---

## Acceptance Test Suite

### AT-UC-03-01 — Successful Guest Name Generation
**Covers**: Main Success Scenario

- **Given** a guest player has joined a game session  
- **When** the system detects no existing display name  
- **Then** the system generates a temporary guest name  
  **And** verifies it is unique within the session  
  **And** assigns and displays the name to all players

### AT-UC-03-02 — Guest Name Generation Failure
**Covers**: Extension 3a

- **Given** a guest player enters a game session  
- **When** the system fails to generate a guest name  
- **Then** the system displays a name generation error  
  **And** prevents the match from starting

### AT-UC-03-03 — Duplicate Guest Name Resolution
**Covers**: Extension 4a

- **Given** a generated guest name conflicts with an existing name  
- **When** the system detects the conflict  
- **Then** the system generates a new name  
  **And** assigns a unique guest name

### AT-UC-03-04 — Guest Name Assignment Failure
**Covers**: Extension 5a

- **Given** a unique guest name is generated  
- **When** the system fails during name assignment  
- **Then** the system displays a name assignment failure message  
  **And** prevents the match from starting

### AT-UC-03-05 — No Unnamed Guest Players
**Covers**: All failure paths

- **Given** a guest player is present in a game session  
- **Then** the system does not allow the match to start without a valid guest name

### AT-UC-03-06 — Guest Name Visible to Players
**Covers**: Success End Condition

- **Given** a guest player has a generated temporary name  
- **When** the match is in progress  
- **Then** the guest name is visible to all players

---

*UC-03 status: COMPLETE*

# UC-04 — Edit Guest Display Name

## Source User Story
**US-04**: As a guest player, I want to edit my display name before joining a room so that I can choose how I appear to others.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a guest player to edit their temporary display name before joining a game room so they can choose how they appear to other players.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Guest Player  
**Secondary Actors**: Name Validation Service, Game Session Manager  
**Trigger**: The guest player selects the option to edit their display name before joining a room.

### Success End Condition
* The guest player’s chosen display name is validated, saved, and shown to other players when the guest joins the room.

### Failed End Condition
* The display name is not updated, and the guest player cannot join the room with the edited name.

### Preconditions
* The player is participating as a guest.
* A temporary guest name has already been generated.
* The pre-room or lobby screen is available.

### Main Success Scenario
1. The guest player selects the option to edit their display name.
2. The system displays an editable display name field pre-filled with the current guest name.
3. The guest player enters a new display name.
4. The guest player submits the updated display name.
5. The system validates the display name against naming rules.
6. The system verifies that the display name is unique within the target room.
7. The system saves the updated display name for the guest session.
8. The system allows the guest player to join the room with the updated display name visible to other players.

### Extensions
* **5a**: The display name violates naming rules.  
  * **5a1**: The system displays an error message describing the naming rules and prompts the guest player to enter a different name.
* **6a**: The display name is already in use within the room.  
  * **6a1**: The system displays an error message indicating the name is unavailable and prompts the guest player to choose another name.
* **7a**: The system fails to save the updated display name due to a server or session error.  
  * **7a1**: The system displays an error message indicating the name could not be saved and prevents the guest player from joining the room.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: The exact naming rules and maximum length for display names are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A guest player prepares to join a game room and wants to customize how they appear to others. On the pre-room screen, the guest selects the option to edit their display name.

The system displays an editable name field containing the current temporary guest name. The guest enters a new display name and submits it. The system validates the name against naming rules and checks that it is unique within the room.

Once validated, the system saves the updated display name for the guest session. The guest then joins the room, and the updated display name is visible to other players.

### Alternative Scenario 5a — Invalid Display Name
The guest player edits the display name and submits a name that violates the system’s naming rules.

The system detects the violation and displays an error message describing the naming rules. The guest remains on the name-edit screen and is prompted to enter a different display name. The name is not updated.

### Alternative Scenario 6a — Display Name Already in Use
The guest player submits a display name that meets naming rules but is already in use by another player in the room.

The system displays an error message indicating that the display name is unavailable. The guest is prompted to choose a different name and cannot join the room with the duplicate name.

### Alternative Scenario 7a — Failure Saving Display Name
The guest player submits a valid and unique display name. While saving the updated name, the system encounters a server or session error.

The system displays an error message indicating that the display name could not be saved. The guest player is prevented from joining the room until the issue is resolved.

---

## Acceptance Test Suite

### AT-UC-04-01 — Successful Display Name Edit
**Covers**: Main Success Scenario

- **Given** a guest player is on the pre-room screen  
- **When** the guest edits and submits a valid, unique display name  
- **Then** the system saves the updated display name  
  **And** allows the guest to join the room  
  **And** displays the updated name to other players

### AT-UC-04-02 — Invalid Display Name
**Covers**: Extension 5a

- **Given** the display name edit field is available  
- **When** the guest submits a name that violates naming rules  
- **Then** the system displays a naming rules error  
  **And** does not update the display name

### AT-UC-04-03 — Duplicate Display Name
**Covers**: Extension 6a

- **Given** another player in the room already uses the submitted name  
- **When** the guest submits the display name  
- **Then** the system rejects the name  
  **And** prompts the guest to choose a different name  
  **And** does not allow the guest to join the room

### AT-UC-04-04 — Display Name Save Failure
**Covers**: Extension 7a

- **Given** a valid and unique display name is submitted  
- **When** the system fails to save the updated display name  
- **Then** the system displays a save failure message  
  **And** prevents the guest from joining the room

### AT-UC-04-05 — No Invalid Name in Room
**Covers**: All failure paths

- **Given** a display name update attempt fails  
- **Then** the room does not contain an invalid or duplicate display name for the guest

### AT-UC-04-06 — Updated Name Visible
**Covers**: Success End Condition

- **Given** a guest player successfully updates their display name  
- **When** the guest joins the room  
- **Then** the updated display name is visible to other players

---

*UC-04 status: COMPLETE*

# UC-05 — Display Signed-In Profile in Lobby

## Source User Story
**US-05**: As a signed-in player, I want my display name and profile avatar to be shown in the lobby so that other players can recognize me.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a signed-in player’s display name and profile avatar to be shown in the game lobby so other players can recognize them.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Signed-In Player  
**Secondary Actors**: Profile Service, Game Lobby Service, Account Database  
**Trigger**: The signed-in player enters the lobby.

### Success End Condition
* The signed-in player’s display name and profile avatar are retrieved and displayed in the lobby, visible to other players.

### Failed End Condition
* The signed-in player’s identity information is not displayed correctly in the lobby, and other players cannot recognize them.

### Preconditions
* The player is authenticated.
* The player has an account profile with a display name.
* The lobby is available.

### Main Success Scenario
1. The signed-in player enters the lobby.
2. The system retrieves the player’s display name and profile avatar from the profile service.
3. The system validates that the retrieved profile data is available for display.
4. The system displays the player’s display name and profile avatar in the lobby.
5. The system updates the lobby participant list so other players can see the player’s display name and avatar.

### Extensions
* **2a**: The system cannot retrieve the player profile due to a server or network error.  
  * **2a1**: The system displays a message indicating the profile could not be loaded and shows a default avatar with the player’s identifier if available.
* **3a**: The player profile is missing an avatar or the avatar cannot be displayed.  
  * **3a1**: The system displays a default avatar and continues showing the player’s display name.
* **4a**: The system cannot update the lobby participant list due to a server error.  
  * **4a1**: The system displays an error message indicating the lobby display may be out of date and advises the player to refresh or rejoin.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The source of the profile avatar (uploaded image versus OAuth provider avatar) and fallback display rules are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A signed-in player opens the Blend Colour game and navigates into the lobby where players wait before joining or creating a room. When the player enters the lobby, the system retrieves the player’s display name and profile avatar from the profile service.

The system confirms that the profile data is suitable for display and then shows the player’s display name and avatar in the lobby interface. The system updates the lobby participant list so other players can see the signed-in player’s display name and avatar and can recognize them while waiting in the lobby.

### Alternative Scenario 2a — Profile Retrieval Failure
A signed-in player enters the lobby, and the system attempts to retrieve the player’s profile information. A server or network error prevents the system from loading the player profile.

The system displays a message indicating that the profile could not be loaded. The system shows a default avatar and displays the player using an identifier if available. Other players may not see the correct profile details until the profile can be retrieved.

### Alternative Scenario 3a — Missing or Unusable Avatar
A signed-in player enters the lobby, and the system retrieves the player profile. The profile does not include an avatar, or the avatar cannot be displayed due to an invalid or unsupported image.

The system displays the player’s display name but substitutes a default avatar. The player remains visible in the lobby and can still be recognized by name.

### Alternative Scenario 4a — Lobby Participant List Update Failure
A signed-in player enters the lobby, and the system successfully retrieves the player’s display name and avatar. While updating the lobby participant list, the system encounters a server error.

The system displays an error message indicating that the lobby display may be out of date and advises the player to refresh or rejoin. The player may not be visible to other players until the lobby participant list update succeeds.

---

## Acceptance Test Suite

### AT-UC-05-01 — Successful Profile Display in Lobby
**Covers**: Main Success Scenario

- **Given** a player is signed in and the lobby is available  
- **When** the player enters the lobby  
- **Then** the system retrieves the player’s display name and avatar  
  **And** displays them in the lobby  
  **And** updates the lobby participant list for other players

### AT-UC-05-02 — Profile Retrieval Failure Fallback
**Covers**: Extension 2a

- **Given** a signed-in player enters the lobby  
- **When** the system cannot retrieve the player profile  
- **Then** the system displays a profile load failure message  
  **And** shows a default avatar  
  **And** displays the player using an identifier if available

### AT-UC-05-03 — Missing or Invalid Avatar Fallback
**Covers**: Extension 3a

- **Given** the player profile is retrieved  
- **When** the avatar is missing or cannot be displayed  
- **Then** the system displays the player’s display name  
  **And** shows a default avatar

### AT-UC-05-04 — Lobby Participant List Update Failure
**Covers**: Extension 4a

- **Given** the player’s display name and avatar are available  
- **When** the system fails to update the lobby participant list  
- **Then** the system displays a lobby out-of-date message  
  **And** advises the player to refresh or rejoin

### AT-UC-05-05 — No Incorrect Avatar Shown
**Covers**: All failure paths

- **Given** a profile display failure occurs  
- **Then** the system does not display an incorrect avatar for the player

### AT-UC-05-06 — Other Players Can Recognize Signed-In Player
**Covers**: Success End Condition

- **Given** the signed-in player is in the lobby  
- **When** another player views the lobby participant list  
- **Then** the signed-in player’s display name and avatar are visible

---

*UC-05 status: COMPLETE*

# UC-06 — Link OAuth Identity to User ID

## Source User Story
**US-06**: As a signed-in player, I want the system to link my OAuth identity to a unique user ID so that my progress and stats are stored correctly.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a signed-in player’s OAuth identity to be linked to a unique internal user ID so progress and statistics are stored consistently across sessions.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Signed-In Player  
**Secondary Actors**: OAuth Provider (Google/GitHub), Authentication Service, Account Database, Progress/Stats Store  
**Trigger**: The player completes OAuth sign-in and the system must establish or confirm an internal user ID.

### Success End Condition
* The player’s OAuth identity is linked to a unique internal user ID, and future progress and stats are stored under that user ID.

### Failed End Condition
* The OAuth identity is not linked to a user ID, and the system cannot reliably store or retrieve the player’s progress and stats.

### Preconditions
* The player successfully completes OAuth authentication.
* The system can access account storage services.

### Main Success Scenario
1. The player completes OAuth sign-in.
2. The system receives the player’s verified OAuth identity details.
3. The system checks whether the OAuth identity is already linked to an internal user ID.
4. The system creates a new unique internal user ID if no link exists.
5. The system links the OAuth identity to the internal user ID in the account database.
6. The system confirms the link and associates the current authenticated session with the internal user ID.
7. The system stores and retrieves progress and stats using the internal user ID for the signed-in player.

### Extensions
* **2a**: The system cannot retrieve verified identity details from the OAuth provider.  
  * **2a1**: The system displays an error message indicating identity could not be verified and prevents account linking.
* **3a**: The system detects that the OAuth identity is already linked to a different existing account in a conflicting way.  
  * **3a1**: The system displays an error message indicating the account could not be linked and advises the player to contact support or use the previously linked account.
* **5a**: The system cannot store the OAuth-to-user-ID link due to a database or server error.  
  * **5a1**: The system displays an error message indicating linking failed and advises the player to try again later.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The policy for resolving identity conflicts and whether users can merge accounts is not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A signed-in player uses an OAuth provider to authenticate into the Blend Colour game and expects their progress and stats to persist between sessions. After the player completes OAuth sign-in, the system receives the player’s verified OAuth identity details.

The system checks whether this OAuth identity is already linked to an internal user ID. If no link exists, the system creates a new unique user ID and stores the mapping between the OAuth identity and that user ID in the account database. The system associates the player’s current authenticated session with the internal user ID. From this point forward, the system stores and retrieves the player’s progress and statistics using the internal user ID so the player’s data remains consistent across sessions.

### Alternative Scenario 2a — Identity Details Cannot Be Verified
The player completes the OAuth provider interaction. The system attempts to retrieve verified identity details but cannot obtain the required information from the provider.

The system displays an error message indicating that the identity could not be verified and prevents the linking process from proceeding. The player’s OAuth identity is not linked to a user ID, and the player cannot rely on persistent progress and stats.

### Alternative Scenario 3a — OAuth Identity Conflict
The player completes OAuth sign-in, and the system retrieves verified identity details. During linking, the system detects that the OAuth identity is already linked to a different internal account in a conflicting way.

The system displays an error message indicating that the account could not be linked and advises the player to use the previously linked account or contact support. No new link is created, and the current session is not associated with a new user ID.

### Alternative Scenario 5a — System or Database Error During Linking
The player completes OAuth sign-in and the system retrieves verified identity details. The system creates or identifies the internal user ID and attempts to store the OAuth-to-user-ID link.

A database or server error prevents the system from storing the link. The system displays an error message indicating that linking failed due to a system issue and advises the player to try again later. The OAuth identity is not reliably linked, and the session is not associated with a confirmed user ID.

---

## Acceptance Test Suite

### AT-UC-06-01 — Successful OAuth Identity Linking
**Covers**: Main Success Scenario

- **Given** a player completes OAuth sign-in successfully  
- **When** the system processes verified OAuth identity details  
- **Then** the system links the OAuth identity to a unique internal user ID  
  **And** associates the session with that user ID  
  **And** stores and retrieves progress and stats using that user ID

### AT-UC-06-02 — Identity Details Cannot Be Verified
**Covers**: Extension 2a

- **Given** a player attempts to sign in via OAuth  
- **When** the system cannot retrieve verified identity details  
- **Then** the system displays an identity verification failure message  
  **And** does not create or store an OAuth-to-user-ID link

### AT-UC-06-03 — OAuth Identity Conflict
**Covers**: Extension 3a

- **Given** an OAuth identity is already linked to an existing account  
- **When** the player attempts to link the same OAuth identity in a conflicting way  
- **Then** the system rejects the linking attempt  
  **And** displays an account linking conflict message  
  **And** does not create a new link

### AT-UC-06-04 — Linking Storage Failure
**Covers**: Extension 5a

- **Given** verified identity details are available  
- **When** the system fails while storing the OAuth-to-user-ID link  
- **Then** the system displays a linking failure message  
  **And** does not confirm the session as linked to a user ID

### AT-UC-06-05 — No Partial or Duplicate Links
**Covers**: All failure paths

- **Given** an account linking attempt fails  
- **Then** no partial, duplicate, or inconsistent OAuth-to-user-ID link exists in the account database

### AT-UC-06-06 — Progress Stored Under User ID
**Covers**: Success End Condition

- **Given** an OAuth identity is linked to an internal user ID  
- **When** the player completes a game action that updates progress or stats  
- **Then** the system stores the update under the internal user ID

---

*UC-06 status: COMPLETE*

# UC-07 — Maintain Active Session

## Source User Story
**US-07**: As a signed-in player, I want my session to stay active for a period of time so that I don’t have to log in repeatedly.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a signed-in player’s authentication session to remain active for a defined period so the player does not need to log in repeatedly.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Signed-In Player  
**Secondary Actors**: Authentication Service, Session Store, OAuth Provider (Google/GitHub)  
**Trigger**: The player opens or returns to the game while an existing session may still be valid.

### Success End Condition
* The player’s session remains valid for the configured period, allowing the player to access signed-in features without re-authenticating.

### Failed End Condition
* The session is not valid or cannot be refreshed, and the player must log in again to access signed-in features.

### Preconditions
* The player has previously signed in successfully.
* Session persistence is enabled by the system configuration.

### Main Success Scenario
1. The signed-in player closes or backgrounds the game.
2. The player later reopens or returns to the game within the session active period.
3. The system loads the player’s stored session information.
4. The system validates that the session is still active and has not expired.
5. The system restores the signed-in state for the player.
6. The system grants the player access to signed-in features without requiring a new login.

### Extensions
* **2a**: The player returns after the session has expired.  
  * **2a1**: The system prompts the player to log in again and does not grant access to signed-in features until authentication completes.
* **3a**: The system cannot load stored session information due to a storage or device error.  
  * **3a1**: The system prompts the player to log in again and displays a message indicating the session could not be restored.
* **4a**: The session is invalid due to security checks or revocation.  
  * **4a1**: The system clears the stored session and prompts the player to log in again.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The exact session duration, refresh rules, and security requirements for session persistence are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A signed-in player finishes playing and closes or backgrounds the Blend Colour game. Later, the player returns to the game within the session active period and expects to continue without logging in again.

When the player reopens the game, the system loads stored session information and checks whether the session is still valid and unexpired. The system restores the player’s signed-in state and grants access to signed-in features immediately. The player can continue using the game without repeating the login process.

### Alternative Scenario 2a — Session Expired
A signed-in player closes the game and later returns after the configured session active period has passed. When the player reopens the game, the system determines that the session has expired.

The system prompts the player to log in again and does not grant access to signed-in features until authentication completes. The player must re-authenticate to continue as a signed-in user.

### Alternative Scenario 3a — Session Cannot Be Loaded
A signed-in player returns to the game within the session active period. The system attempts to load stored session information but encounters a storage or device error.

The system displays a message indicating that the session could not be restored and prompts the player to log in again. The player is treated as signed out until a new login succeeds.

### Alternative Scenario 4a — Session Invalid or Revoked
A signed-in player returns to the game and the system loads stored session information. During validation, the system determines the session is invalid due to security checks or revocation.

The system clears the stored session information and prompts the player to log in again. The player cannot access signed-in features until authentication completes.

---

## Acceptance Test Suite

### AT-UC-07-01 — Session Restored Within Active Period
**Covers**: Main Success Scenario

- **Given** a player has previously signed in and session persistence is enabled  
- **When** the player returns to the game within the session active period  
- **Then** the system validates the session as active  
  **And** restores the signed-in state  
  **And** grants access to signed-in features without a new login

### AT-UC-07-02 — Session Expired Requires Login
**Covers**: Extension 2a

- **Given** a player has previously signed in  
- **When** the player returns after the session has expired  
- **Then** the system prompts the player to log in again  
  **And** does not grant access to signed-in features until authentication completes

### AT-UC-07-03 — Session Load Failure Requires Login
**Covers**: Extension 3a

- **Given** a stored session exists  
- **When** the system cannot load the stored session information  
- **Then** the system displays a session restore failure message  
  **And** prompts the player to log in again

### AT-UC-07-04 — Session Invalid or Revoked
**Covers**: Extension 4a

- **Given** stored session information is loaded  
- **When** the system determines the session is invalid or revoked  
- **Then** the system clears the stored session  
  **And** prompts the player to log in again

### AT-UC-07-05 — No Access Without Valid Session
**Covers**: All failure paths

- **Given** the player is not authenticated due to session expiration, load failure, or invalidation  
- **Then** the system does not allow access to signed-in features until the player logs in again

### AT-UC-07-06 — Session Duration Enforced
**Covers**: Success End Condition

- **Given** a player session has been active for the configured period  
- **When** the session duration limit is exceeded  
- **Then** the system treats the session as expired and requires re-authentication

---

*UC-07 status: COMPLETE*

# UC-08 — Log Out

## Source User Story
**US-08**: As a player, I want to log out so that I can switch accounts or end my authenticated session.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to explicitly end their authenticated session so they can switch accounts or stop using signed-in features.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Authentication Service, Session Store  
**Trigger**: The player selects the “Log Out” option.

### Success End Condition
* The player’s authenticated session is terminated, and the player is treated as signed out.

### Failed End Condition
* The authenticated session is not fully terminated, and the player remains partially or incorrectly signed in.

### Preconditions
* The player is currently authenticated.
* The game interface is available.

### Main Success Scenario
1. The player selects the “Log Out” option.
2. The system invalidates the player’s active authentication session.
3. The system clears locally stored session data.
4. The system updates the player’s state to signed out.
5. The system redirects the player to the start or sign-in screen.

### Extensions
* **2a**: The system cannot invalidate the session due to a server or network error.  
  * **2a1**: The system displays an error message indicating logout failed and advises the player to try again.
* **3a**: Local session data cannot be cleared due to a device or storage error.  
  * **3a1**: The system displays a warning indicating logout may be incomplete and prompts the player to restart the game.
* **4a**: The player’s session is already invalid or expired.  
  * **4a1**: The system treats the player as logged out and redirects to the start or sign-in screen.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: Whether logout should also revoke OAuth provider tokens is not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A signed-in player decides to stop using the current account or switch to a different account. The player selects the **Log Out** option from the game interface.

The system invalidates the player’s active authentication session and clears any locally stored session data. The system updates the player’s state to signed out and redirects the player to the start or sign-in screen, where the player may log in again or exit the game.

### Alternative Scenario 2a — Session Invalidation Failure
The player selects the **Log Out** option. The system attempts to invalidate the active authentication session but encounters a server or network error.

The system displays an error message indicating that logout failed and advises the player to try again. The player remains signed in until the logout operation succeeds.

### Alternative Scenario 3a — Local Session Data Clearance Failure
The player selects the **Log Out** option, and the system invalidates the authentication session successfully. While clearing locally stored session data, the system encounters a device or storage error.

The system displays a warning indicating that logout may be incomplete and prompts the player to restart the game to ensure the session is fully cleared.

### Alternative Scenario 4a — Session Already Invalid
The player selects the **Log Out** option, but the system determines that the authentication session is already invalid or expired.

The system treats the player as logged out and redirects them to the start or sign-in screen. No further logout actions are required.

---

## Acceptance Test Suite

### AT-UC-08-01 — Successful Logout
**Covers**: Main Success Scenario

- **Given** a player is authenticated  
- **When** the player selects the “Log Out” option  
- **Then** the system invalidates the authentication session  
  **And** clears local session data  
  **And** redirects the player to the start or sign-in screen

### AT-UC-08-02 — Session Invalidation Failure
**Covers**: Extension 2a

- **Given** a player is authenticated  
- **When** the system fails to invalidate the session  
- **Then** the system displays a logout failure message  
  **And** the player remains signed in

### AT-UC-08-03 — Local Session Data Clearance Failure
**Covers**: Extension 3a

- **Given** the authentication session is invalidated  
- **When** the system fails to clear local session data  
- **Then** the system displays a logout warning  
  **And** prompts the player to restart the game

### AT-UC-08-04 — Session Already Invalid
**Covers**: Extension 4a

- **Given** the player’s session is already invalid or expired  
- **When** the player selects the “Log Out” option  
- **Then** the system treats the player as logged out  
  **And** redirects to the start or sign-in screen

### AT-UC-08-05 — No Partial Logout State
**Covers**: All failure paths

- **Given** a logout attempt fails or partially completes  
- **Then** the system does not leave the player in a partially authenticated state

### AT-UC-08-06 — No Access After Logout
**Covers**: Success End Condition

- **Given** a player has logged out  
- **Then** the system does not allow access to signed-in features until the player logs in again

---

*UC-08 status: COMPLETE*

# UC-09 — Expire Guest Session After Inactivity

## Source User Story
**US-09**: As a guest player, I want my session to expire automatically after inactivity so that temporary access is managed safely.

---

## Use Case (Cockburn Style)

**Goal in Context**: Automatically expire an inactive guest session to ensure temporary access is managed safely and system resources are protected.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Guest Player  
**Secondary Actors**: Session Manager, Activity Monitor  
**Trigger**: A guest session remains inactive beyond the configured inactivity threshold.

### Success End Condition
* The inactive guest session expires automatically, and the guest is treated as signed out.

### Failed End Condition
* The guest session does not expire correctly or leaves residual access after inactivity.

### Preconditions
* The player is participating as a guest.
* A guest session is active.
* Inactivity tracking is enabled by system configuration.

### Main Success Scenario
1. A guest player becomes inactive during a game session.
2. The system monitors the period of inactivity.
3. The inactivity period exceeds the configured threshold.
4. The system expires the guest session.
5. The system clears guest session data.
6. The system redirects the guest to the start or sign-in screen.

### Extensions
* **3a**: The guest becomes active again before the inactivity threshold is reached.  
  * **3a1**: The system resets the inactivity timer and keeps the guest session active.
* **4a**: The system fails to expire the guest session due to a server or session error.  
  * **4a1**: The system displays an error message indicating the session could not be expired and restricts further guest access.
* **5a**: Guest session data cannot be fully cleared due to a storage error.  
  * **5a1**: The system displays a warning indicating session cleanup may be incomplete and prevents further guest access.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: The exact inactivity duration and definition of guest activity are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A guest player joins the Blend Colour game and then stops interacting with the game. The system continues to monitor the guest session for activity.

After the inactivity period exceeds the configured threshold, the system automatically expires the guest session. The system clears the guest session data and redirects the guest to the start or sign-in screen, ensuring temporary access is managed safely.

### Alternative Scenario 3a — Guest Becomes Active Before Timeout
A guest player becomes inactive for a short period, but then resumes interaction with the game before the inactivity threshold is reached.

The system detects renewed activity, resets the inactivity timer, and keeps the guest session active. The guest continues playing without interruption.

### Alternative Scenario 4a — Session Expiration Failure
A guest player remains inactive beyond the inactivity threshold. The system attempts to expire the guest session but encounters a server or session error.

The system displays an error message indicating that the session could not be expired correctly and restricts further guest access until the issue is resolved.

### Alternative Scenario 5a — Guest Session Cleanup Failure
A guest session exceeds the inactivity threshold and the system expires the session. While clearing guest session data, the system encounters a storage error.

The system displays a warning indicating that session cleanup may be incomplete and prevents further guest access. The guest is treated as signed out.

---

## Acceptance Test Suite

### AT-UC-09-01 — Guest Session Expires After Inactivity
**Covers**: Main Success Scenario

- **Given** a guest session is active  
- **When** the guest remains inactive beyond the configured threshold  
- **Then** the system expires the guest session  
  **And** clears guest session data  
  **And** redirects the guest to the start or sign-in screen

### AT-UC-09-02 — Activity Resets Inactivity Timer
**Covers**: Extension 3a

- **Given** a guest session is active  
- **When** the guest becomes active before the inactivity threshold is reached  
- **Then** the system resets the inactivity timer  
  **And** keeps the guest session active

### AT-UC-09-03 — Session Expiration Failure
**Covers**: Extension 4a

- **Given** a guest session exceeds the inactivity threshold  
- **When** the system fails to expire the session  
- **Then** the system displays a session expiration error  
  **And** restricts further guest access

### AT-UC-09-04 — Guest Session Cleanup Failure
**Covers**: Extension 5a

- **Given** a guest session is expired  
- **When** the system fails to clear guest session data  
- **Then** the system displays a cleanup warning  
  **And** prevents further guest access

### AT-UC-09-05 — No Residual Guest Access
**Covers**: All failure paths

- **Given** a guest session expiration attempt fails or partially completes  
- **Then** the system does not allow residual guest access

### AT-UC-09-06 — Guest Access Revoked After Expiration
**Covers**: Success End Condition

- **Given** a guest session has expired  
- **Then** the guest cannot access game features without starting a new session

---

*UC-09 status: COMPLETE*

# UC-10 — Prevent Duplicate Display Names in Room

## Source User Story
**US-10**: As a player, I want the system to prevent duplicate display names within the same room so that players are not confused.

---

## Use Case (Cockburn Style)

**Goal in Context**: Prevent players in the same room from having duplicate display names so players can be identified clearly and confusion is avoided.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Room Service, Name Validation Service  
**Trigger**: A player attempts to join a room or update a display name to a name already used in that room.

### Success End Condition
* No two players in the same room share the same display name, and the player joins or updates their name with a unique display name.

### Failed End Condition
* Duplicate display names exist in the room or the system cannot enforce uniqueness, causing player identification confusion.

### Preconditions
* The room exists and is available to join.
* The player has a display name to use in the room.

### Main Success Scenario
1. A player attempts to join a room or update their display name.
2. The system receives the player’s requested display name and target room.
3. The system checks whether the requested display name is already in use within the room.
4. The system determines the requested display name is unique within the room.
5. The system allows the player to join the room or updates the player’s display name.
6. The system displays the player list in the room with unique display names.

### Extensions
* **3a**: The requested display name is already in use within the room.  
  * **3a1**: The system rejects the request, displays an error message indicating the name is unavailable, and prompts the player to choose another name.
* **3b**: The system cannot check room name availability due to a server or network error.  
  * **3b1**: The system displays an error message indicating the name could not be verified and prevents the player from joining or updating their name.
* **5a**: The system fails while applying the unique name due to a room or session error.  
  * **5a1**: The system displays an error message indicating the name change or join failed and advises the player to try again.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The rules for case sensitivity and normalization of display names are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is about to join a room or change their display name while in a room. The player submits a display name to be used in that room.

The system checks whether the requested display name is already in use within the room. The system determines that the name is unique and allows the player to join the room or applies the name update. The room’s player list is displayed with each player having a unique display name so players can identify each other without confusion.

### Alternative Scenario 3a — Duplicate Name Requested
A player attempts to join a room or update their display name to a name that is already being used by another player in the room.

The system detects that the requested name is not unique. The system rejects the request, displays an error message indicating that the name is unavailable, and prompts the player to choose a different display name. No duplicate name is introduced into the room.

### Alternative Scenario 3b — Name Availability Check Failure
A player attempts to join a room or update their display name. The system attempts to check whether the requested display name is already in use within the room but encounters a server or network error.

The system displays an error message indicating that the name could not be verified and prevents the player from joining the room or updating the display name. The player must try again once the system can perform the check.

### Alternative Scenario 5a — Failure Applying Unique Name
A player submits a display name that is unique within the room. While allowing the player to join or applying the name update, the system encounters a room or session error.

The system displays an error message indicating that the join or name change failed and advises the player to try again. The player is not added to the room or the name change is not applied.

---

## Acceptance Test Suite

### AT-UC-10-01 — Successful Unique Name Enforcement
**Covers**: Main Success Scenario

- **Given** a room exists and a player provides a display name  
- **When** the player attempts to join the room or update their name  
- **Then** the system verifies the display name is unique within the room  
  **And** allows the join or applies the name update  
  **And** displays the room player list with unique names

### AT-UC-10-02 — Duplicate Display Name Rejected
**Covers**: Extension 3a

- **Given** a room contains a player using the name “Alex”  
- **When** another player attempts to join or update their name to “Alex”  
- **Then** the system rejects the request  
  **And** displays a name unavailable error  
  **And** does not introduce a duplicate name into the room

### AT-UC-10-03 — Name Availability Check Failure
**Covers**: Extension 3b

- **Given** a player attempts to join a room or update their name  
- **When** the system cannot check room name availability  
- **Then** the system displays a name verification failure message  
  **And** prevents the join or name update

### AT-UC-10-04 — Failure Applying Unique Name
**Covers**: Extension 5a

- **Given** the requested display name is unique within the room  
- **When** the system fails while applying the join or name update  
- **Then** the system displays a join or update failure message  
  **And** does not add the player or apply the name change

### AT-UC-10-05 — No Duplicate Names After Failure
**Covers**: All failure paths

- **Given** a join or name update request fails  
- **Then** the room does not contain duplicate display names

### AT-UC-10-06 — Room Names Are Unique
**Covers**: Success End Condition

- **Given** multiple players are present in the same room  
- **Then** the system does not allow two players to share the same display name

---

*UC-10 status: COMPLETE*

# UC-11 — Reconnect to Existing Game Room

## Source User Story
**US-11**: As a player, I want the system to support reconnecting to the same room (guest or signed-in) after a disconnect so that I can continue the match.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player who was previously participating in a game room to reconnect to the same room after a disconnect so they can continue the match.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Game Session Manager, Game State Store, Network Service  
**Trigger**: The player launches or returns to the game after a disconnect and attempts to reconnect.

### Success End Condition
* The player is reconnected to the same game room and can continue participating in the ongoing match.

### Failed End Condition
* The player is not reconnected to the previous room and cannot continue the interrupted match.

### Preconditions
* The player was previously connected to a game room.
* The game room still exists and the match has not ended.

### Main Success Scenario
1. The player disconnects from the game due to a network interruption or client interruption.
2. The player relaunches or returns to the game client.
3. The system identifies the player as a previously connected participant using signed-in account data or a guest session identifier.
4. The system checks whether the associated game room and match are still active.
5. The system restores the player’s association with the game room.
6. The system synchronizes the current game state with the player.
7. The system allows the player to continue participating in the match.

### Extensions
* **3a**: The system cannot identify the player as a previous participant.  
  * **3a1**: The system informs the player that reconnection is not possible and returns them to the main menu.
* **4a**: The game room or match is no longer active.  
  * **4a1**: The system informs the player that the match has ended and returns them to the main menu.
* **5a**: The system encounters an error while restoring the player’s room association.  
  * **5a1**: The system displays an error message indicating reconnection failed and returns the player to the main menu.

### Related Information
* **Priority**: High  
* **Frequency**: Medium  
* **Open Issues**: The exact timeout duration for allowing reconnection after a disconnect is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is participating in a Blend Colour match when their connection is interrupted, causing an unexpected disconnect. After the interruption, the player relaunches or returns to the game client.

The system recognizes the player as a previous participant using their signed-in account or guest session identifier. The system verifies that the associated game room and match are still active. The system restores the player’s association with the room, synchronizes the current game state, and allows the player to continue participating in the ongoing match.

### Alternative Scenario 3a — Player Cannot Be Identified
After the player returns to the game client following a disconnect, the system attempts to identify them as a previous participant. The system cannot match the player to a prior signed-in account or guest session identifier.

The system informs the player that reconnection to the previous match is not possible and returns the player to the main menu. The player does not rejoin the match.

### Alternative Scenario 4a — Room or Match No Longer Active
The player returns to the game client after a disconnect and is successfully identified as a previous participant. The system checks the associated game room and determines that the match has already ended or the room no longer exists.

The system informs the player that the match has ended and returns the player to the main menu. The player cannot continue the interrupted match.

### Alternative Scenario 5a — Error During Room Restoration
The player returns to the game client after a disconnect and is identified as a previous participant. The system verifies that the game room is active but encounters an error while restoring the player’s association with the room.

The system displays an error message indicating that reconnection failed and returns the player to the main menu. The player does not rejoin the match.

---

## Acceptance Test Suite

### AT-UC-11-01 — Successful Reconnection to Active Match
**Covers**: Main Success Scenario

- **Given** a player was previously connected to an active game room  
- **When** the player returns to the game after a disconnect  
- **Then** the system identifies the player as a previous participant  
  **And** reconnects the player to the same game room  
  **And** synchronizes the current game state  
  **And** allows the player to continue the match

### AT-UC-11-02 — Player Cannot Be Identified
**Covers**: Extension 3a

- **Given** a player returns to the game after a disconnect  
- **When** the system cannot identify the player as a previous participant  
- **Then** the system informs the player reconnection is not possible  
  **And** returns the player to the main menu

### AT-UC-11-03 — Room or Match No Longer Active
**Covers**: Extension 4a

- **Given** a player is identified as a previous participant  
- **When** the associated game room or match is no longer active  
- **Then** the system informs the player that the match has ended  
  **And** returns the player to the main menu

### AT-UC-11-04 — Error During Room Restoration
**Covers**: Extension 5a

- **Given** a player is identified as a previous participant and the room is active  
- **When** the system fails while restoring the player’s room association  
- **Then** the system displays a reconnection failure message  
  **And** returns the player to the main menu

### AT-UC-11-05 — No Partial Reconnection State
**Covers**: All failure paths

- **Given** a reconnection attempt fails at identification, room validation, or restoration  
- **Then** the player is not partially connected to the game room

### AT-UC-11-06 — Reconnection Restores Participation
**Covers**: Success End Condition

- **Given** a player successfully reconnects to an active match  
- **When** the player resumes gameplay  
- **Then** the player can participate normally in the ongoing match

---

*UC-11 status: COMPLETE*

# UC-12 — Use Color-Blending Panel

## Source User Story
**US-12**: As a player, I want a color-blending panel so that I can mix colors interactively.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to interactively mix colors using a color-blending panel during gameplay.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Color Blending Engine, Game UI System  
**Trigger**: The player opens the color-blending panel during a match.

### Success End Condition
* The player successfully mixes colors using the panel and the selected blended color is available for gameplay use.

### Failed End Condition
* The player cannot mix or apply colors using the color-blending panel.

### Preconditions
* The player is participating in an active match.
* The color-blending panel is available in the game interface.

### Main Success Scenario
1. The player opens the color-blending panel.
2. The system displays available base colors and blending controls.
3. The player selects one or more base colors.
4. The player adjusts blending controls to mix the selected colors.
5. The system updates the blended color in real time based on the player’s input.
6. The player confirms the blended color selection.
7. The system makes the blended color available for gameplay use.

### Extensions
* **3a**: The player selects an invalid color combination.  
  * **3a1**: The system prevents the selection and displays a message indicating the combination is not allowed.
* **4a**: The system encounters an error while calculating the blended color.  
  * **4a1**: The system displays an error message and resets the blending controls to the last valid state.
* **6a**: The player closes the color-blending panel without confirming a color.  
  * **6a1**: The system discards the unconfirmed blend and returns the player to gameplay with no color change.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact set of base colors and blending rules are not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is participating in a Blend Colour match and opens the color-blending panel to mix colors. The system displays a set of base colors along with interactive controls for blending.

The player selects base colors and adjusts the blending controls. As the player interacts with the panel, the system updates the blended color in real time. When satisfied, the player confirms the blended color. The system applies the selected blended color, making it available for gameplay use.

### Alternative Scenario 3a — Invalid Color Combination
The player opens the color-blending panel and attempts to select a combination of colors that is not allowed by the game rules.

The system prevents the selection and displays a message indicating that the chosen color combination is invalid. The player remains in the color-blending panel with no blended color applied.

### Alternative Scenario 4a — Blending Calculation Error
The player selects base colors and adjusts the blending controls. During blending, the system encounters an error while calculating the resulting color.

The system displays an error message and resets the blending controls to the last valid state. No new blended color is applied.

### Alternative Scenario 6a — Panel Closed Without Confirmation
The player opens the color-blending panel and experiments with mixing colors but closes the panel without confirming a blended color.

The system discards the unconfirmed blend and returns the player to gameplay without changing the currently selected color.

---

## Acceptance Test Suite

### AT-UC-12-01 — Successful Color Blending
**Covers**: Main Success Scenario

- **Given** a player is in an active match  
- **When** the player mixes colors using the color-blending panel and confirms the selection  
- **Then** the system updates the blended color  
  **And** makes the blended color available for gameplay use

### AT-UC-12-02 — Invalid Color Combination
**Covers**: Extension 3a

- **Given** the color-blending panel is open  
- **When** the player selects an invalid color combination  
- **Then** the system prevents the selection  
  **And** displays an invalid-combination message

### AT-UC-12-03 — Blending Calculation Error
**Covers**: Extension 4a

- **Given** the player is blending colors  
- **When** the system encounters an error calculating the blended color  
- **Then** the system displays an error message  
  **And** resets the blending controls to the last valid state

### AT-UC-12-04 — Panel Closed Without Confirmation
**Covers**: Extension 6a

- **Given** the player has an unconfirmed blended color  
- **When** the player closes the color-blending panel without confirming  
- **Then** the system discards the unconfirmed blend  
  **And** leaves the active color unchanged

### AT-UC-12-05 — No Partial Color Application
**Covers**: All failure paths

- **Given** color blending fails or is not confirmed  
- **Then** no partial or unintended color change is applied

### AT-UC-12-06 — Blended Color Available
**Covers**: Success End Condition

- **Given** a player successfully confirms a blended color  
- **When** gameplay continues  
- **Then** the blended color is available for use during the match

---

*UC-12 status: COMPLETE*

# UC-13 — Distribute Identical Base Colors to All Players

## Source User Story
**US-13**: As a player, I want all players to receive the same base colors so that the competition is fair.

---

## Use Case (Cockburn Style)

**Goal in Context**: Ensure that all players in a match receive the same set of base colors to maintain fairness in gameplay.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Game Session Manager, Color Distribution Service  
**Trigger**: A match is initialized or a player joins an active match.

### Success End Condition
* All players in the match have access to the same set of base colors.

### Failed End Condition
* One or more players do not receive the same base colors as others, resulting in an unfair match state.

### Preconditions
* A game match is being created or is already active.
* The base color set for the match is defined.

### Main Success Scenario
1. The system initializes a new match or processes a player joining an active match.
2. The system determines the base color set for the match.
3. The system assigns the same base color set to all players in the match.
4. The system verifies that each player has access to the assigned base colors.
5. The match proceeds with all players using the same base colors.

### Extensions
* **2a**: The base color set cannot be retrieved or determined.  
  * **2a1**: The system prevents the match from starting and displays an error message indicating base colors could not be assigned.
* **3a**: The system fails to assign base colors to one or more players.  
  * **3a1**: The system halts match progression and displays an error message indicating a color distribution failure.
* **4a**: A player joins the match after it has already started.  
  * **4a1**: The system assigns the same base color set used by existing players to the joining player.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The mechanism for selecting or randomizing the base color set is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A match is created in the Blend Colour game, and the system begins match initialization. The system determines the base color set to be used for the match.

The system assigns the same base colors to all participating players and verifies that each player has access to them. Once verification is complete, the match proceeds with all players competing under identical color conditions.

### Alternative Scenario 2a — Base Color Set Cannot Be Determined
During match initialization, the system attempts to determine the base color set but fails due to a configuration or retrieval error.

The system prevents the match from starting and displays an error message indicating that base colors could not be assigned. The match does not proceed.

### Alternative Scenario 3a — Failure to Assign Base Colors
The system determines the base color set but encounters an error while assigning the colors to one or more players.

The system halts match progression and displays an error message indicating a color distribution failure. The match remains in a non-playable state.

### Alternative Scenario 4a — Player Joins After Match Start
A player joins an already active match after initial color assignment has completed.

The system assigns the same base color set used by the existing players to the newly joined player. The player joins the match with identical base colors, and gameplay continues.

---

## Acceptance Test Suite

### AT-UC-13-01 — All Players Receive Identical Base Colors
**Covers**: Main Success Scenario

- **Given** a match is initialized with multiple players  
- **When** the system assigns base colors  
- **Then** all players receive the same base color set

### AT-UC-13-02 — Base Color Set Cannot Be Determined
**Covers**: Extension 2a

- **Given** a match is being initialized  
- **When** the system cannot retrieve or determine the base color set  
- **Then** the system prevents the match from starting  
  **And** displays a base color assignment error message

### AT-UC-13-03 — Failure During Color Assignment
**Covers**: Extension 3a

- **Given** a base color set has been determined  
- **When** the system fails to assign the colors to one or more players  
- **Then** the system halts match progression  
  **And** displays a color distribution failure message

### AT-UC-13-04 — Late-Joining Player Receives Same Base Colors
**Covers**: Extension 4a

- **Given** a match is already active  
- **When** a new player joins the match  
- **Then** the system assigns the same base color set as existing players

### AT-UC-13-05 — No Partial Color Distribution
**Covers**: All failure paths

- **Given** base color distribution fails at any point  
- **Then** no player has an advantage due to partial or inconsistent base color assignment

### AT-UC-13-06 — Fair Color Distribution Maintained
**Covers**: Success End Condition

- **Given** a match is active with all players assigned base colors  
- **When** gameplay begins or continues  
- **Then** all players have access to the same base colors

---

*UC-13 status: COMPLETE*

# UC-14 — Adjust Color Values Using Sliders

## Source User Story
**US-14**: As a player, I want to adjust color values using sliders so that blending is intuitive.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to intuitively adjust color values using sliders while blending colors during gameplay.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Color Blending Engine, Game UI System  
**Trigger**: The player interacts with color value sliders in the color-blending panel.

### Success End Condition
* The player successfully adjusts color values using sliders and the updated blended color is available for gameplay use.

### Failed End Condition
* The player cannot adjust color values using sliders or the adjustments cannot be applied.

### Preconditions
* The player is participating in an active match.
* The color-blending panel is open and slider controls are available.

### Main Success Scenario
1. The player opens the color-blending panel.
2. The system displays slider controls for adjusting color values.
3. The player moves one or more sliders to adjust color values.
4. The system updates the blended color in real time based on slider positions.
5. The player confirms the adjusted color values.
6. The system applies the updated blended color for gameplay use.

### Extensions
* **3a**: The player moves a slider beyond an allowed range.  
  * **3a1**: The system constrains the slider to valid limits and maintains the nearest valid value.
* **4a**: The system encounters an error while updating the blended color from slider input.  
  * **4a1**: The system displays an error message and restores the last valid blended color.
* **5a**: The player closes the color-blending panel without confirming changes.  
  * **5a1**: The system discards unconfirmed adjustments and leaves the current color unchanged.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The specific color model and slider granularity are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is blending colors during a Blend Colour match and opens the color-blending panel. The system displays slider controls that allow the player to adjust individual color values.

The player moves the sliders to fine-tune the color blend. As the sliders move, the system updates the blended color in real time. When satisfied, the player confirms the changes, and the system applies the adjusted blended color for use in gameplay.

### Alternative Scenario 3a — Slider Moved Beyond Allowed Range
The player attempts to move a color slider beyond its allowed range while adjusting color values.

The system constrains the slider to valid limits and keeps the color value at the nearest valid setting. The player can continue adjusting within the allowed range.

### Alternative Scenario 4a — Error Updating Blended Color
The player adjusts one or more sliders, but the system encounters an error while calculating the resulting blended color.

The system displays an error message and restores the last valid blended color. No new color adjustments are applied.

### Alternative Scenario 5a — Panel Closed Without Confirmation
The player adjusts sliders but closes the color-blending panel without confirming the changes.

The system discards the unconfirmed adjustments and returns the player to gameplay with the previously active color unchanged.

---

## Acceptance Test Suite

### AT-UC-14-01 — Successful Color Adjustment Using Sliders
**Covers**: Main Success Scenario

- **Given** the color-blending panel is open during an active match  
- **When** the player adjusts color values using sliders and confirms the changes  
- **Then** the system updates the blended color  
  **And** makes the updated color available for gameplay use

### AT-UC-14-02 — Slider Exceeds Allowed Range
**Covers**: Extension 3a

- **Given** the player is adjusting color values using sliders  
- **When** a slider is moved beyond its allowed range  
- **Then** the system constrains the slider to valid limits  
  **And** maintains the nearest valid color value

### AT-UC-14-03 — Error Updating Color from Sliders
**Covers**: Extension 4a

- **Given** the player is adjusting sliders  
- **When** the system encounters an error updating the blended color  
- **Then** the system displays an error message  
  **And** restores the last valid blended color

### AT-UC-14-04 — Panel Closed Without Confirming Slider Changes
**Covers**: Extension 5a

- **Given** the player has unconfirmed slider adjustments  
- **When** the player closes the color-blending panel without confirming  
- **Then** the system discards the unconfirmed adjustments  
  **And** leaves the active color unchanged

### AT-UC-14-05 — No Partial Color Adjustment
**Covers**: All failure paths

- **Given** slider-based color adjustment fails or is not confirmed  
- **Then** no partial or unintended color change is applied

### AT-UC-14-06 — Slider-Based Adjustment Applied
**Covers**: Success End Condition

- **Given** a player successfully confirms slider adjustments  
- **When** gameplay continues  
- **Then** the adjusted blended color is available for use during the match

---

*UC-14 status: COMPLETE*

# UC-15 — Blend Colors in Real Time

## Source User Story
**US-15**: As a player, I want to blend colors in real time so that I can instantly see the result.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to see color blending results immediately as they adjust blending inputs during gameplay.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Color Blending Engine, Game UI System  
**Trigger**: The player adjusts blending inputs while the color-blending panel is open.

### Success End Condition
* The blended color updates immediately in response to player input and is visible to the player.

### Failed End Condition
* The blended color does not update in real time in response to player input.

### Preconditions
* The player is participating in an active match.
* The color-blending panel is open and interactive controls are available.

### Main Success Scenario
1. The player opens the color-blending panel.
2. The system displays interactive blending controls.
3. The player adjusts blending inputs.
4. The system updates the blended color immediately as the inputs change.
5. The player observes the updated blended color in real time.

### Extensions
* **4a**: The system encounters an error while updating the blended color.  
  * **4a1**: The system displays an error message and restores the last valid blended color.
* **3a**: The system cannot process input changes fast enough to update the blended color in real time.  
  * **3a1**: The system temporarily pauses real-time updates and displays a message indicating blending updates are unavailable.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The performance thresholds required to qualify as real-time updates are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is blending colors during a Blend Colour match and opens the color-blending panel. The system displays interactive controls for blending.

As the player adjusts the blending inputs, the system updates the blended color immediately. The player can instantly see the result of each adjustment, allowing them to fine-tune the blend in real time.

### Alternative Scenario 4a — Error Updating Blended Color
The player adjusts blending inputs while the color-blending panel is open. The system encounters an error while calculating or rendering the blended color.

The system displays an error message and restores the last valid blended color. Real-time updates stop until the issue is resolved.

### Alternative Scenario 3a — Real-Time Updates Not Available
The player adjusts blending inputs, but the system cannot process the changes quickly enough to maintain real-time updates.

The system temporarily pauses real-time blending updates and displays a message indicating that real-time blending is unavailable. The player can continue interacting, but updates are not shown in real time.

---

## Acceptance Test Suite

### AT-UC-15-01 — Real-Time Color Blending Updates
**Covers**: Main Success Scenario

- **Given** the color-blending panel is open during an active match  
- **When** the player adjusts blending inputs  
- **Then** the system updates the blended color immediately  
  **And** the updated color is visible to the player

### AT-UC-15-02 — Error During Real-Time Update
**Covers**: Extension 4a

- **Given** the player is adjusting blending inputs  
- **When** the system encounters an error updating the blended color  
- **Then** the system displays an error message  
  **And** restores the last valid blended color

### AT-UC-15-03 — Real-Time Updates Unavailable
**Covers**: Extension 3a

- **Given** the player is adjusting blending inputs  
- **When** the system cannot process updates in real time  
- **Then** the system pauses real-time updates  
  **And** displays a message indicating real-time blending is unavailable

### AT-UC-15-04 — No Partial Real-Time Update State
**Covers**: All failure paths

- **Given** real-time blending fails or is paused  
- **Then** no partial or inconsistent blended color state is displayed

### AT-UC-15-05 — Real-Time Blending Visible
**Covers**: Success End Condition

- **Given** real-time blending is functioning  
- **When** the player adjusts blending inputs  
- **Then** the blended color is immediately visible to the player

---

*UC-15 status: COMPLETE*

# UC-16 — Reset Selected Colors

## Source User Story
**US-16**: As a player, I want to reset my selected colors so that I can restart blending if needed.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to reset their currently selected and blended colors so they can restart the color blending process during gameplay.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Color Blending Engine, Game UI System  
**Trigger**: The player selects the reset option in the color-blending panel.

### Success End Condition
* The player’s selected and blended colors are reset to the default base state and the player can begin blending again.

### Failed End Condition
* The player’s selected and blended colors are not reset.

### Preconditions
* The player is participating in an active match.
* The color-blending panel is open and a reset option is available.

### Main Success Scenario
1. The player opens the color-blending panel.
2. The player selects the reset option.
3. The system clears the player’s current blended color selection.
4. The system restores the default base colors.
5. The system updates the color-blending panel to reflect the reset state.
6. The player can begin blending colors again.

### Extensions
* **3a**: The system encounters an error while resetting colors.  
  * **3a1**: The system displays an error message and retains the previous color state.
* **2a**: The player selects reset when no blended color is currently selected.  
  * **2a1**: The system leaves the color state unchanged and remains in the color-blending panel.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: The exact default base color state after reset is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is blending colors during a Blend Colour match and decides to restart the blending process. The player opens the color-blending panel and selects the reset option.

The system clears the current blended color, restores the default base colors, and updates the panel to reflect the reset state. The player can immediately begin blending colors again from the default state.

### Alternative Scenario 3a — Error During Reset
The player selects the reset option in the color-blending panel. The system encounters an error while attempting to clear the current color selection.

The system displays an error message and retains the previous color state. The player cannot restart blending at this time.

### Alternative Scenario 2a — No Blended Color Selected
The player opens the color-blending panel and selects the reset option when no blended color is currently selected.

The system leaves the color state unchanged and remains in the color-blending panel. The player may continue blending without interruption.

---

## Acceptance Test Suite

### AT-UC-16-01 — Successful Color Reset
**Covers**: Main Success Scenario

- **Given** a player has a selected or blended color  
- **When** the player selects the reset option  
- **Then** the system clears the blended color  
  **And** restores the default base colors  
  **And** allows the player to begin blending again

### AT-UC-16-02 — Error During Reset
**Covers**: Extension 3a

- **Given** a player selects the reset option  
- **When** the system encounters an error while resetting colors  
- **Then** the system displays an error message  
  **And** retains the previous color state

### AT-UC-16-03 — Reset with No Blended Color
**Covers**: Extension 2a

- **Given** no blended color is currently selected  
- **When** the player selects the reset option  
- **Then** the system leaves the color state unchanged  
  **And** remains in the color-blending panel

### AT-UC-16-04 — No Partial Reset State
**Covers**: All failure paths

- **Given** a reset attempt fails  
- **Then** no partial reset or inconsistent color state exists

### AT-UC-16-05 — Reset Enables Restart of Blending
**Covers**: Success End Condition

- **Given** the player successfully resets their colors  
- **When** the player begins interacting with the blending controls  
- **Then** blending starts from the default base color state

---

*UC-16 status: COMPLETE*

# UC-17 — Constrain Color Values to Valid Ranges

## Source User Story
**US-17**: As a player, I want color values to stay within valid ranges so that invalid colors cannot be chosen.

---

## Use Case (Cockburn Style)

**Goal in Context**: Prevent a player from selecting invalid colors by ensuring all color values remain within defined valid ranges during color blending.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Color Validation Service, Color Blending Engine, Game UI System  
**Trigger**: The player adjusts color values while blending colors.

### Success End Condition
* All color values are constrained to valid ranges and the player cannot select an invalid color.

### Failed End Condition
* The system allows an invalid color value to be selected or applied.

### Preconditions
* The player is participating in an active match.
* The player is using the color-blending panel with adjustable color values.

### Main Success Scenario
1. The player opens the color-blending panel.
2. The system displays controls for adjusting color values.
3. The player adjusts one or more color values.
4. The system validates the updated values against the defined valid ranges.
5. The system constrains any out-of-range values to the nearest valid limits.
6. The system updates the displayed blended color using the constrained values.
7. The player can continue blending without selecting invalid colors.

### Extensions
* **4a**: The system cannot validate color values due to a validation error.  
  * **4a1**: The system displays an error message and prevents applying the updated color values.
* **3a**: The player attempts to enter or set a color value outside valid ranges.  
  * **3a1**: The system rejects the out-of-range input and keeps the previous valid value.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact valid range definitions and color model are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is blending colors during a Blend Colour match and opens the color-blending panel. The system displays controls that allow the player to adjust color values.

As the player changes color values, the system validates each update against defined valid ranges. If any value would go out of range, the system constrains it to the nearest valid limit. The system updates the blended color using only valid values, ensuring the player cannot select an invalid color while continuing to blend.

### Alternative Scenario 4a — Validation Error Prevents Applying Values
The player adjusts color values in the color-blending panel. When the system attempts to validate the updated values, a validation error occurs and the system cannot confirm whether the values are valid.

The system displays an error message and prevents applying the updated color values. The player remains in the color-blending panel with no invalid color applied.

### Alternative Scenario 3a — Out-of-Range Input Attempt
The player attempts to set a color value outside the allowed range using the available controls.

The system rejects the out-of-range input and keeps the previous valid value. The player can continue blending using valid values only.

---

## Acceptance Test Suite

### AT-UC-17-01 — Color Values Constrained to Valid Ranges
**Covers**: Main Success Scenario

- **Given** the player is adjusting color values in the color-blending panel  
- **When** the player changes a color value  
- **Then** the system validates the updated value against valid ranges  
  **And** constrains any out-of-range value to the nearest valid limit  
  **And** updates the blended color using only valid values

### AT-UC-17-02 — Validation Error Prevents Applying Values
**Covers**: Extension 4a

- **Given** the player adjusts color values  
- **When** the system cannot validate the updated values due to a validation error  
- **Then** the system displays an error message  
  **And** prevents applying the updated color values

### AT-UC-17-03 — Out-of-Range Input Rejected
**Covers**: Extension 3a

- **Given** the player attempts to set a color value outside valid ranges  
- **When** the out-of-range input is submitted through the control  
- **Then** the system rejects the input  
  **And** keeps the previous valid value

### AT-UC-17-04 — No Partial Invalid Color Application
**Covers**: All failure paths

- **Given** validation fails or an out-of-range value is attempted  
- **Then** no invalid or partially invalid color is applied

### AT-UC-17-05 — Invalid Colors Cannot Be Chosen
**Covers**: Success End Condition

- **Given** the player is using the color-blending panel  
- **When** the player continues adjusting values  
- **Then** the player cannot select an invalid color value

---

*UC-17 status: COMPLETE*

# UC-18 — Preview Blended Color Before Submitting

## Source User Story
**US-18**: As a player, I want to preview my final blended color before submitting it so that I can verify my choice.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to preview the final blended color before submitting so they can verify their selection.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Color Blending Engine, Game UI System  
**Trigger**: The player selects the preview option before submitting a blended color.

### Success End Condition
* The player sees a preview of the final blended color and can decide whether to submit or revise it.

### Failed End Condition
* The player cannot preview the final blended color before submitting.

### Preconditions
* The player is participating in an active match.
* The player has a blended color prepared for potential submission.

### Main Success Scenario
1. The player blends colors to create a final candidate color.
2. The player selects the preview option.
3. The system displays a preview of the final blended color.
4. The player reviews the previewed color.
5. The player confirms they want to submit the previewed color.
6. The system proceeds with color submission using the previewed color.

### Extensions
* **2a**: The player selects preview without having a candidate blended color.  
  * **2a1**: The system displays a message indicating there is no blended color to preview.
* **3a**: The system encounters an error rendering the preview.  
  * **3a1**: The system displays an error message and does not proceed to submission.
* **5a**: The player decides not to submit after previewing.  
  * **5a1**: The system returns the player to blending with no submission made.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact preview format and whether submission is irreversible are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is participating in a Blend Colour match and finishes blending a color they intend to submit. Before submitting, the player selects a preview option to verify their choice.

The system displays a preview of the final blended color. The player reviews the previewed result and confirms they want to submit it. The system proceeds with submission using the previewed color.

### Alternative Scenario 2a — No Candidate Color to Preview
The player selects the preview option without having blended a candidate color.

The system displays a message indicating there is no blended color to preview. The player remains in the blending interface and no submission occurs.

### Alternative Scenario 3a — Preview Rendering Error
The player selects the preview option after blending a candidate color. The system encounters an error while attempting to render the preview.

The system displays an error message and does not proceed to submission. The player cannot verify the color through preview at this time.

### Alternative Scenario 5a — Player Declines to Submit After Preview
The player previews the final blended color but decides it is not acceptable.

The system returns the player to the blending interface without submitting the color. The player can continue adjusting the blend.

---

## Acceptance Test Suite

### AT-UC-18-01 — Preview Final Blended Color and Submit
**Covers**: Main Success Scenario

- **Given** a player has a blended candidate color  
- **When** the player previews the final blended color and confirms submission  
- **Then** the system displays the previewed color  
  **And** proceeds with submission using the previewed color

### AT-UC-18-02 — Preview Without Candidate Color
**Covers**: Extension 2a

- **Given** the player has not blended a candidate color  
- **When** the player selects the preview option  
- **Then** the system displays a message indicating there is no blended color to preview  
  **And** no submission occurs

### AT-UC-18-03 — Preview Rendering Error
**Covers**: Extension 3a

- **Given** a player has a blended candidate color  
- **When** the system encounters an error rendering the preview  
- **Then** the system displays an error message  
  **And** does not proceed to submission

### AT-UC-18-04 — Player Declines to Submit After Preview
**Covers**: Extension 5a

- **Given** a player is viewing a preview of the blended color  
- **When** the player chooses not to submit  
- **Then** the system returns the player to blending  
  **And** no submission is made

### AT-UC-18-05 — No Partial Submission After Preview Failure
**Covers**: All failure paths

- **Given** preview fails or the player declines submission  
- **Then** no partial or unintended submission occurs

### AT-UC-18-06 — Preview Enables Verification Before Submission
**Covers**: Success End Condition

- **Given** the player previews the final blended color  
- **When** the player reviews the preview  
- **Then** the player can decide to submit or revise the color

---

*UC-18 status: COMPLETE*

# UC-19 — View Target Color

## Source User Story
**US-19**: As a player, I want to see a target color so that I know what I am trying to match.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to view the target color for the current round so they know what color they are trying to match.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Game UI System  
**Trigger**: A round begins or the player opens the round objective display.

### Success End Condition
* The player can view the target color for the round.

### Failed End Condition
* The player cannot view the target color and does not know what to match.

### Preconditions
* The player is participating in an active match.
* A round target color has been selected for the current round.

### Main Success Scenario
1. The system starts a round and selects a target color.
2. The system displays the target color to all players in the match.
3. The player views the displayed target color.
4. The player continues gameplay with the target color as the objective.

### Extensions
* **1a**: The system cannot select or retrieve a target color.  
  * **1a1**: The system displays an error message and prevents the round from proceeding.
* **2a**: The system fails to display the target color to a player.  
  * **2a1**: The system displays an error message and prompts the player to retry viewing the target color.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The rules for choosing the target color and whether it is randomized or pre-defined are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A new round begins in the Blend Colour game, and the system selects a target color for players to match. The system displays the target color in the game interface.

The player views the displayed target color and uses it as the objective while blending colors during gameplay.

### Alternative Scenario 1a — Target Color Cannot Be Selected or Retrieved
The system starts a round and attempts to select or retrieve the target color. The system cannot determine a target color due to an error.

The system displays an error message and prevents the round from proceeding. The player cannot continue the round without a target color.

### Alternative Scenario 2a — Target Color Not Displayed
The system selects a target color for the round but fails to display it to a particular player due to a display or delivery error.

The system displays an error message and prompts the player to retry viewing the target color. The player does not receive the target color until the display succeeds.

---

## Acceptance Test Suite

### AT-UC-19-01 — Target Color Displayed for Round
**Covers**: Main Success Scenario

- **Given** a round starts in an active match  
- **When** the system selects the round target color  
- **Then** the system displays the target color to the player  
  **And** the player can view the target color

### AT-UC-19-02 — Target Color Cannot Be Selected or Retrieved
**Covers**: Extension 1a

- **Given** a round is starting  
- **When** the system cannot select or retrieve a target color  
- **Then** the system displays an error message  
  **And** prevents the round from proceeding

### AT-UC-19-03 — Target Color Not Displayed to Player
**Covers**: Extension 2a

- **Given** a target color exists for the round  
- **When** the system fails to display the target color to the player  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing the target color

### AT-UC-19-04 — No Partial Round Start Without Target Color
**Covers**: All failure paths

- **Given** the system fails to determine or display a target color  
- **Then** the player does not proceed in the round without a visible target color

### AT-UC-19-05 — Target Color Available as Objective
**Covers**: Success End Condition

- **Given** a target color has been displayed to the player  
- **When** the player continues gameplay in the round  
- **Then** the player has access to the target color as the round objective

---

*UC-19 status: COMPLETE*

# UC-20 — Randomly Generate Target Color

## Source User Story
**US-20**: As a player, I want the target color to be generated randomly so that each round is unique.

---

## Use Case (Cockburn Style)

**Goal in Context**: Generate a random target color at the start of each round so that rounds are unique for players.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Random Color Generator  
**Trigger**: A new round is started.

### Success End Condition
* The system generates a random target color for the round and the round uses that target color.

### Failed End Condition
* The system does not generate a random target color and the round cannot use a unique target color.

### Preconditions
* The player is participating in an active match.
* The system is starting a new round.

### Main Success Scenario
1. The system starts a new round.
2. The system requests a random target color from the random color generator.
3. The random color generator returns a random target color to the system.
4. The system assigns the returned target color as the round target color.
5. The system proceeds with the round using the assigned target color.

### Extensions
* **2a**: The random color generator cannot generate a target color.  
  * **2a1**: The system displays an error message and prevents the round from proceeding.
* **3a**: The random color generator returns an invalid target color.  
  * **3a1**: The system rejects the invalid color and requests a new random target color.
  * **3a2**: If a valid target color cannot be generated, the system displays an error message and prevents the round from proceeding.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The constraints on random target color generation and what counts as a valid target are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A new round begins in the Blend Colour game. To ensure the round is unique, the system requests a random target color from the random color generator.

The generator returns a random target color, and the system assigns it as the target for the round. The round proceeds using this randomly generated target color as the objective for players to match.

### Alternative Scenario 2a — Random Generator Cannot Generate Color
The system starts a new round and requests a random target color from the random color generator. The generator fails to generate a target color due to an internal error.

The system displays an error message and prevents the round from proceeding. The player cannot continue the round without a randomly generated target color.

### Alternative Scenario 3a — Invalid Random Target Color Returned
The system requests a random target color and receives a result from the random color generator. The returned color is invalid according to the system’s target color requirements.

The system rejects the invalid color and requests a new random target color. If the system cannot obtain a valid target color after retrying, the system displays an error message and prevents the round from proceeding.

---

## Acceptance Test Suite

### AT-UC-20-01 — Random Target Color Generated for Round
**Covers**: Main Success Scenario

- **Given** a new round is starting in an active match  
- **When** the system requests a random target color  
- **Then** the random color generator returns a target color  
  **And** the system assigns it as the round target color  
  **And** the round proceeds using the assigned target color

### AT-UC-20-02 — Random Generator Cannot Generate Target Color
**Covers**: Extension 2a

- **Given** a new round is starting  
- **When** the random color generator cannot generate a target color  
- **Then** the system displays an error message  
  **And** prevents the round from proceeding

### AT-UC-20-03 — Invalid Random Target Color Returned
**Covers**: Extension 3a

- **Given** a new round is starting  
- **When** the random color generator returns an invalid target color  
- **Then** the system rejects the invalid color  
  **And** requests a new random target color  
  **And** if no valid target color can be generated then the system displays an error message and prevents the round from proceeding

### AT-UC-20-04 — No Partial Round Start Without Valid Random Target
**Covers**: All failure paths

- **Given** the system cannot obtain a valid random target color  
- **Then** the round does not proceed with a missing or invalid target color

### AT-UC-20-05 — Random Target Color Enables Unique Round
**Covers**: Success End Condition

- **Given** the system assigns a randomly generated target color to the round  
- **When** the round proceeds  
- **Then** the round uses the randomly generated target color as its objective

---

*UC-20 status: COMPLETE*

# UC-21 — Calculate Color Distance for Objective Scoring

## Source User Story
**US-21**: As a player, I want the system to calculate the distance between my color and the target color so that scoring is objective.

---

## Use Case (Cockburn Style)

**Goal in Context**: Calculate an objective distance measure between a player’s submitted color and the target color so the game can score the match result objectively.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Scoring Service, Color Distance Calculator, Round Manager  
**Trigger**: The player submits a final blended color for a round.

### Success End Condition
* The system calculates the distance between the player’s submitted color and the target color and produces a scoring value for the round.

### Failed End Condition
* The system cannot calculate the distance and cannot score the round objectively.

### Preconditions
* The player is participating in an active match.
* A target color exists for the current round.
* The player has submitted a final blended color for the round.

### Main Success Scenario
1. The player submits a final blended color for the current round.
2. The system retrieves the target color for the current round.
3. The system retrieves the player’s submitted color.
4. The system calculates the distance between the player’s submitted color and the target color.
5. The system records the calculated distance as the player’s round scoring value.
6. The system makes the scoring value available for round scoring.

### Extensions
* **2a**: The system cannot retrieve the target color for the round.  
  * **2a1**: The system displays an error message and does not score the submission.
* **3a**: The system cannot retrieve the player’s submitted color.  
  * **3a1**: The system displays an error message and does not score the submission.
* **4a**: The system encounters an error while calculating the distance.  
  * **4a1**: The system displays an error message and does not score the submission.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The specific color distance metric and color space are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player finishes blending a color for the round and submits their final blended color. The system retrieves the round’s target color and the player’s submitted color.

The system calculates the distance between the submitted color and the target color using the scoring method defined by the game. The system records this distance as the player’s scoring value for the round and makes it available for round scoring.

### Alternative Scenario 2a — Target Color Retrieval Failure
The player submits a final blended color for the round. The system attempts to retrieve the target color but fails due to a retrieval error.

The system displays an error message and does not score the submission. The player’s submission remains unscored.

### Alternative Scenario 3a — Submitted Color Retrieval Failure
The player submits a final blended color for the round. The system attempts to retrieve the player’s submitted color but fails due to a retrieval or storage error.

The system displays an error message and does not score the submission. The player’s submission remains unscored.

### Alternative Scenario 4a — Distance Calculation Error
The system retrieves both the target color and the player’s submitted color. While calculating the distance between them, the system encounters an error in the distance calculation.

The system displays an error message and does not score the submission. No scoring value is recorded for the player.

---

## Acceptance Test Suite

### AT-UC-21-01 — Calculate and Record Color Distance
**Covers**: Main Success Scenario

- **Given** a target color exists for the current round and the player submits a final blended color  
- **When** the system processes the submission  
- **Then** the system calculates the distance between the submitted color and the target color  
  **And** records the distance as the player’s scoring value  
  **And** makes the scoring value available for round scoring

### AT-UC-21-02 — Target Color Retrieval Failure
**Covers**: Extension 2a

- **Given** the player submits a final blended color  
- **When** the system cannot retrieve the target color for the round  
- **Then** the system displays an error message  
  **And** does not score the submission

### AT-UC-21-03 — Submitted Color Retrieval Failure
**Covers**: Extension 3a

- **Given** the player submits a final blended color  
- **When** the system cannot retrieve the player’s submitted color  
- **Then** the system displays an error message  
  **And** does not score the submission

### AT-UC-21-04 — Distance Calculation Error
**Covers**: Extension 4a

- **Given** the system has the target color and the player’s submitted color  
- **When** the system encounters an error while calculating the distance  
- **Then** the system displays an error message  
  **And** does not score the submission

### AT-UC-21-05 — No Partial Scoring State
**Covers**: All failure paths

- **Given** scoring fails due to missing target color, missing submitted color, or calculation error  
- **Then** no partial or incorrect scoring value is recorded for the player

### AT-UC-21-06 — Distance Enables Objective Scoring
**Covers**: Success End Condition

- **Given** the system records a distance value for the player’s submission  
- **When** the round scoring is determined  
- **Then** the distance value is used as an objective scoring value for the round

---

*UC-21 status: COMPLETE*

# UC-22 — Score Reflects Color Accuracy

## Source User Story
**US-22**: As a player, I want my score to reflect how close my color is to the target color so that accuracy matters.

---

## Use Case (Cockburn Style)

**Goal in Context**: Assign a player score that reflects how close the submitted color is to the target color so scoring rewards accuracy.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Scoring Service, Color Distance Calculator, Round Manager  
**Trigger**: The system completes distance calculation for a submitted color.

### Success End Condition
* The system assigns a score that reflects the calculated distance between the player’s color and the target color.

### Failed End Condition
* The system does not assign a score or assigns a score that does not reflect color accuracy.

### Preconditions
* The player is participating in an active match.
* A target color exists for the current round.
* The system has calculated the distance between the player’s color and the target color.

### Main Success Scenario
1. The system completes calculation of the distance between the player’s submitted color and the target color.
2. The system applies the scoring rules to the calculated distance.
3. The system derives a score that reflects the closeness of the submitted color to the target color.
4. The system records the score for the player for the round.
5. The system makes the score available to the player.

### Extensions
* **1a**: The system cannot access the calculated distance value.  
  * **1a1**: The system displays an error message and does not assign a score.
* **2a**: The system encounters an error while applying scoring rules.  
  * **2a1**: The system displays an error message and does not assign a score.
* **4a**: The system fails to record the calculated score.  
  * **4a1**: The system displays an error message and does not make the score available.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact scoring function that maps distance to score is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
After a player submits a blended color for a round, the system calculates the distance between the submitted color and the target color. Using this distance, the system applies the game’s scoring rules.

The system derives a score that reflects how close the player’s color is to the target color. The system records the score and makes it available to the player as the round result.

### Alternative Scenario 1a — Distance Value Unavailable
The system attempts to score the player after submission but cannot access the calculated distance between the submitted color and the target color.

The system displays an error message and does not assign a score for the round. The player’s result remains unscored.

### Alternative Scenario 2a — Scoring Rule Application Error
The system retrieves the calculated distance but encounters an error while applying the scoring rules.

The system displays an error message and does not assign a score. No scoring value is recorded for the player.

### Alternative Scenario 4a — Score Recording Failure
The system successfully derives a score from the distance value but fails while attempting to record the score.

The system displays an error message and does not make the score available to the player.

---

## Acceptance Test Suite

### AT-UC-22-01 — Score Reflects Color Accuracy
**Covers**: Main Success Scenario

- **Given** the system has calculated the distance between the player’s color and the target color  
- **When** the system applies scoring rules  
- **Then** the system derives a score that reflects the closeness of the submitted color  
  **And** records the score  
  **And** makes the score available to the player

### AT-UC-22-02 — Distance Value Unavailable
**Covers**: Extension 1a

- **Given** a player submission requires scoring  
- **When** the system cannot access the calculated distance value  
- **Then** the system displays an error message  
  **And** does not assign a score

### AT-UC-22-03 — Scoring Rule Application Error
**Covers**: Extension 2a

- **Given** a calculated distance value exists  
- **When** the system encounters an error applying scoring rules  
- **Then** the system displays an error message  
  **And** does not assign a score

### AT-UC-22-04 — Score Recording Failure
**Covers**: Extension 4a

- **Given** a score has been derived from the distance value  
- **When** the system fails to record the score  
- **Then** the system displays an error message  
  **And** does not make the score available

### AT-UC-22-05 — No Partial or Incorrect Scoring
**Covers**: All failure paths

- **Given** scoring fails at any stage  
- **Then** no partial or incorrect score is recorded for the player

### AT-UC-22-06 — Accuracy-Based Scoring Applied
**Covers**: Success End Condition

- **Given** a score is successfully recorded for the round  
- **When** the player views their result  
- **Then** the score reflects how close the submitted color is to the target color

---

*UC-22 status: COMPLETE*

# UC-23 — View Similarity Percentage

## Source User Story
**US-23**: As a player, I want to see my similarity percentage so that I understand my performance.

---

## Use Case (Cockburn Style)

**Goal in Context**: Display a similarity percentage for a player’s submission so the player can understand performance against the target color.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Results Display Service, Scoring Service  
**Trigger**: Round results are generated for the player after submission.

### Success End Condition
* The player can view a similarity percentage representing how close their color is to the target color.

### Failed End Condition
* The player cannot view a similarity percentage for their submission.

### Preconditions
* The player is participating in an active match.
* The player has submitted a final blended color for the round.
* The system has produced a scoring outcome for the round.

### Main Success Scenario
1. The system completes scoring for the player’s round submission.
2. The system derives a similarity percentage from the scoring outcome.
3. The system displays the similarity percentage to the player.
4. The player views the similarity percentage as part of their round performance.

### Extensions
* **1a**: The system cannot complete scoring for the submission.  
  * **1a1**: The system displays an error message and does not display a similarity percentage.
* **2a**: The system encounters an error deriving the similarity percentage.  
  * **2a1**: The system displays an error message and does not display a similarity percentage.
* **3a**: The system fails to display the similarity percentage to the player.  
  * **3a1**: The system displays an error message and prompts the player to retry viewing results.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact formula that maps scoring outcome to similarity percentage is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
After a player submits a blended color for the round, the system completes scoring for the submission. Using the scoring outcome, the system derives a similarity percentage that represents how close the submitted color is to the target color.

The system displays the similarity percentage to the player as part of the round results. The player views the percentage to understand their performance.

### Alternative Scenario 1a — Scoring Not Completed
The player submits a final blended color, but the system cannot complete scoring for the submission due to a scoring failure.

The system displays an error message and does not display a similarity percentage. The player cannot view performance in percentage form.

### Alternative Scenario 2a — Similarity Derivation Error
The system completes some scoring steps but encounters an error while deriving the similarity percentage from the scoring outcome.

The system displays an error message and does not display a similarity percentage to the player.

### Alternative Scenario 3a — Similarity Not Displayed
The system derives a similarity percentage but fails to display it to the player due to a results display error.

The system displays an error message and prompts the player to retry viewing results. The player does not see the similarity percentage until display succeeds.

---

## Acceptance Test Suite

### AT-UC-23-01 — Similarity Percentage Displayed
**Covers**: Main Success Scenario

- **Given** the system has completed scoring for the player’s submission  
- **When** the system generates round results  
- **Then** the system derives a similarity percentage from the scoring outcome  
  **And** displays the similarity percentage to the player

### AT-UC-23-02 — Scoring Not Completed
**Covers**: Extension 1a

- **Given** a player submission requires results  
- **When** the system cannot complete scoring for the submission  
- **Then** the system displays an error message  
  **And** does not display a similarity percentage

### AT-UC-23-03 — Similarity Derivation Error
**Covers**: Extension 2a

- **Given** a scoring outcome exists for a submission  
- **When** the system encounters an error deriving the similarity percentage  
- **Then** the system displays an error message  
  **And** does not display a similarity percentage

### AT-UC-23-04 — Similarity Not Displayed
**Covers**: Extension 3a

- **Given** the system derives a similarity percentage  
- **When** the system fails to display the similarity percentage to the player  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing results

### AT-UC-23-05 — No Partial or Misleading Similarity Result
**Covers**: All failure paths

- **Given** similarity percentage generation or display fails  
- **Then** no partial or misleading similarity percentage is shown to the player

### AT-UC-23-06 — Similarity Percentage Supports Performance Understanding
**Covers**: Success End Condition

- **Given** the similarity percentage is displayed to the player  
- **When** the player reviews their round result  
- **Then** the player can use the similarity percentage to understand performance

---

*UC-23 status: COMPLETE*

# UC-24 — Rank Players by Closeness

## Source User Story
**US-24**: As a player, I want the system to rank players by closeness so that a winner can be determined.

---

## Use Case (Cockburn Style)

**Goal in Context**: Rank players by how close their submitted colors are to the target color so the system can determine a winner for the round.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Ranking Service, Scoring Service, Round Manager  
**Trigger**: Round scoring is complete for all players.

### Success End Condition
* The system produces a ranking of players ordered by closeness to the target color.

### Failed End Condition
* The system cannot produce a ranking and cannot determine a winner based on closeness.

### Preconditions
* The player is participating in an active match.
* A target color exists for the current round.
* Scoring outcomes that reflect closeness exist for all players in the round.

### Main Success Scenario
1. The system completes scoring for all players in the round.
2. The system retrieves each player’s closeness value for the round.
3. The system orders players from closest to farthest based on the closeness values.
4. The system records the ranked ordering for the round.
5. The system makes the ranking available for determining the round winner.

### Extensions
* **1a**: The system cannot complete scoring for all players.  
  * **1a1**: The system displays an error message and does not produce a ranking.
* **2a**: The system cannot retrieve one or more players’ closeness values.  
  * **2a1**: The system displays an error message and does not produce a ranking.
* **3a**: Two or more players have the same closeness value.  
  * **3a1**: The system assigns the same rank to tied players.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The tie-breaking policy beyond equal ranking is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
At the end of a round, all players have submitted their blended colors and the system completes scoring for each submission. The system retrieves each player’s closeness value for the round.

The system orders players from closest to farthest based on those values and records the ranked ordering. The system makes the ranking available so the round winner can be determined.

### Alternative Scenario 1a — Scoring Not Completed for All Players
The system attempts to rank players when the round ends, but scoring cannot be completed for all players due to a scoring failure.

The system displays an error message and does not produce a ranking for the round. A winner cannot be determined using closeness.

### Alternative Scenario 2a — Closeness Values Cannot Be Retrieved
The system completes scoring, but cannot retrieve one or more players’ closeness values due to a retrieval error.

The system displays an error message and does not produce a ranking. The round winner cannot be determined using closeness.

### Alternative Scenario 3a — Tied Closeness Values
The system retrieves closeness values for all players and begins ordering them. Two or more players have the same closeness value.

The system assigns the same rank to the tied players. The ranking reflects the tie so the result can be interpreted consistently.

---

## Acceptance Test Suite

### AT-UC-24-01 — Players Ranked by Closeness
**Covers**: Main Success Scenario

- **Given** scoring outcomes exist for all players in the round  
- **When** the system ranks players for the round  
- **Then** the system retrieves each player’s closeness value  
  **And** orders players from closest to farthest  
  **And** records the ranked ordering

### AT-UC-24-02 — Scoring Not Completed for All Players
**Covers**: Extension 1a

- **Given** the round ends and ranking is required  
- **When** the system cannot complete scoring for all players  
- **Then** the system displays an error message  
  **And** does not produce a ranking

### AT-UC-24-03 — Closeness Values Cannot Be Retrieved
**Covers**: Extension 2a

- **Given** scoring has completed for the round  
- **When** the system cannot retrieve one or more players’ closeness values  
- **Then** the system displays an error message  
  **And** does not produce a ranking

### AT-UC-24-04 — Tied Players Receive Same Rank
**Covers**: Extension 3a

- **Given** closeness values exist for all players  
- **When** two or more players have the same closeness value  
- **Then** the system assigns the same rank to the tied players

### AT-UC-24-05 — No Partial or Inconsistent Ranking
**Covers**: All failure paths

- **Given** ranking fails due to missing scoring or missing values  
- **Then** no partial or inconsistent ranking is recorded or displayed

### AT-UC-24-06 — Ranking Determines Winner by Closeness
**Covers**: Success End Condition

- **Given** the system records a ranked ordering for the round  
- **When** the round winner is determined  
- **Then** the ranking is based on closeness to the target color

---

*UC-24 status: COMPLETE*

# UC-25 — Resolve Ties Using a Consistent Rule

## Source User Story
**US-25**: As a player, I want ties in score to be resolved using a clear and consistent rule so that match results are not ambiguous.

---

## Use Case (Cockburn Style)

**Goal in Context**: Resolve ties in score using a predefined rule so match results remain clear and unambiguous.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Ranking Service, Tie-Breaking Service, Scoring Service, Round Manager  
**Trigger**: The system detects a tie in score when determining ranked results.

### Success End Condition
* The system resolves score ties using a consistent rule and produces an unambiguous match result.

### Failed End Condition
* The system cannot resolve a tie and match results remain ambiguous.

### Preconditions
* The player is participating in an active match.
* The system has produced scores for the round.
* A tie exists between two or more players’ scores.

### Main Success Scenario
1. The system determines ranked results for the round using player scores.
2. The system detects that two or more players are tied in score.
3. The system retrieves the predefined tie-breaking rule.
4. The system applies the tie-breaking rule to the tied players.
5. The system updates the ranking to reflect the resolved tie.
6. The system records the final unambiguous results for the round.

### Extensions
* **2a**: The system does not detect a tie.  
  * **2a1**: The system proceeds with the original ranking and records results.
* **3a**: The system cannot retrieve the tie-breaking rule.  
  * **3a1**: The system displays an error message and does not finalize results for the round.
* **4a**: The system encounters an error while applying the tie-breaking rule.  
  * **4a1**: The system displays an error message and does not finalize results for the round.

### Related Information
* **Priority**: High  
* **Frequency**: Medium  
* **Open Issues**: The exact tie-breaking rule is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
At the end of a round, the system calculates scores for all players and begins determining the ranked results. The system detects that two or more players are tied in score.

To avoid ambiguity, the system retrieves the predefined tie-breaking rule and applies it to the tied players. The system updates the ranking to reflect the resolved tie and records the final results for the round as an unambiguous match outcome.

### Alternative Scenario 2a — No Tie Detected
The system determines ranked results for the round and finds that all scores are distinct.

The system proceeds with the original ranking and records the results for the round without applying tie-breaking.

### Alternative Scenario 3a — Tie-Breaking Rule Cannot Be Retrieved
The system detects a tie in score while determining round results. The system attempts to retrieve the predefined tie-breaking rule but cannot access it due to a retrieval or configuration error.

The system displays an error message and does not finalize results for the round. The match results remain unresolved.

### Alternative Scenario 4a — Error Applying Tie-Breaking Rule
The system detects a tie and successfully retrieves the predefined tie-breaking rule. While applying the rule to resolve the tie, the system encounters an error.

The system displays an error message and does not finalize results for the round. The match results remain unresolved.

---

## Acceptance Test Suite

### AT-UC-25-01 — Tie Resolved Using Consistent Rule
**Covers**: Main Success Scenario

- **Given** two or more players are tied in score for a round  
- **When** the system finalizes ranked results  
- **Then** the system retrieves the predefined tie-breaking rule  
  **And** applies the rule to the tied players  
  **And** records unambiguous final results

### AT-UC-25-02 — No Tie Detected
**Covers**: Extension 2a

- **Given** round scores are available  
- **When** no tie in score exists  
- **Then** the system records results using the original ranking  
  **And** does not apply tie-breaking

### AT-UC-25-03 — Tie-Breaking Rule Cannot Be Retrieved
**Covers**: Extension 3a

- **Given** a tie in score is detected  
- **When** the system cannot retrieve the tie-breaking rule  
- **Then** the system displays an error message  
  **And** does not finalize results for the round

### AT-UC-25-04 — Error Applying Tie-Breaking Rule
**Covers**: Extension 4a

- **Given** a tie in score is detected and the tie-breaking rule is available  
- **When** the system encounters an error applying the tie-breaking rule  
- **Then** the system displays an error message  
  **And** does not finalize results for the round

### AT-UC-25-05 — No Partial Tie Resolution State
**Covers**: All failure paths

- **Given** tie-breaking fails due to missing rule or application error  
- **Then** no partial or inconsistent resolved ranking is recorded as final

### AT-UC-25-06 — Results Are Unambiguous After Tie Resolution
**Covers**: Success End Condition

- **Given** a tie in score is resolved by the system  
- **When** final results are recorded for the round  
- **Then** the results reflect a clear and consistent tie resolution

---

*UC-25 status: COMPLETE*

# UC-26 — View Tie-Breaking Rule Explanation

## Source User Story
**US-26**: As a player, I want the tie-breaking rule to be visible or explained so that I understand how final rankings are determined.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to view or read an explanation of the tie-breaking rule used for rankings so the player understands how ties are resolved.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Results Display Service, Tie-Breaking Service  
**Trigger**: The player views round results and requests the tie-breaking rule explanation.

### Success End Condition
* The player can view a clear explanation of the tie-breaking rule used to determine final rankings.

### Failed End Condition
* The player cannot view the tie-breaking rule explanation and does not understand how ties are resolved.

### Preconditions
* The player is participating in an active match.
* Round results are available to view.

### Main Success Scenario
1. The player opens the round results view.
2. The player selects an option to view the tie-breaking rule explanation.
3. The system retrieves the tie-breaking rule description.
4. The system displays the tie-breaking rule explanation to the player.
5. The player reviews the explanation and understands how ties are resolved.

### Extensions
* **2a**: The player does not request the tie-breaking rule explanation.  
  * **2a1**: The system displays round results without showing the tie-breaking rule explanation.
* **3a**: The system cannot retrieve the tie-breaking rule description.  
  * **3a1**: The system displays an error message and does not display the explanation.
* **4a**: The system fails to display the explanation to the player.  
  * **4a1**: The system displays an error message and prompts the player to retry viewing the explanation.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: The exact wording and presentation format for the tie-breaking explanation are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player finishes a round and opens the round results view to see the final rankings. To understand how ties are resolved, the player selects an option to view the tie-breaking rule explanation.

The system retrieves the tie-breaking rule description and displays it to the player. The player reviews the explanation and understands how final rankings are determined when scores are tied.

### Alternative Scenario 2a — Explanation Not Requested
The player opens the round results view but does not select the option to view the tie-breaking rule explanation.

The system displays the round results without showing the tie-breaking rule explanation. The player can continue viewing results normally.

### Alternative Scenario 3a — Tie-Breaking Description Retrieval Failure
The player requests the tie-breaking rule explanation. The system attempts to retrieve the tie-breaking rule description but cannot access it due to a retrieval or configuration error.

The system displays an error message and does not display the explanation. The player cannot view the tie-breaking rule details.

### Alternative Scenario 4a — Explanation Display Failure
The player requests the tie-breaking rule explanation and the system retrieves the rule description. The system then fails to display the explanation due to a display error.

The system displays an error message and prompts the player to retry viewing the explanation. The player does not see the explanation until display succeeds.

---

## Acceptance Test Suite

### AT-UC-26-01 — Tie-Breaking Rule Explanation Displayed
**Covers**: Main Success Scenario

- **Given** round results are available  
- **When** the player requests the tie-breaking rule explanation  
- **Then** the system retrieves the tie-breaking rule description  
  **And** displays the explanation to the player

### AT-UC-26-02 — Explanation Not Requested
**Covers**: Extension 2a

- **Given** round results are available  
- **When** the player views results without requesting the tie-breaking explanation  
- **Then** the system displays results without showing the explanation

### AT-UC-26-03 — Tie-Breaking Description Retrieval Failure
**Covers**: Extension 3a

- **Given** the player requests the tie-breaking explanation  
- **When** the system cannot retrieve the tie-breaking rule description  
- **Then** the system displays an error message  
  **And** does not display the explanation

### AT-UC-26-04 — Explanation Display Failure
**Covers**: Extension 4a

- **Given** the tie-breaking rule description is available  
- **When** the system fails to display the explanation  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing the explanation

### AT-UC-26-05 — No Partial or Misleading Explanation
**Covers**: All failure paths

- **Given** retrieval or display of the explanation fails  
- **Then** no partial or misleading tie-breaking explanation is shown

### AT-UC-26-06 — Explanation Supports Understanding of Rankings
**Covers**: Success End Condition

- **Given** the tie-breaking explanation is displayed  
- **When** the player reviews the explanation  
- **Then** the player can understand how final rankings are determined for ties

---

*UC-26 status: COMPLETE*

# UC-27 — Enforce Round Time Limit

## Source User Story
**US-27**: As a player, I want each round to have a time limit so that the game stays fast-paced.

---

## Use Case (Cockburn Style)

**Goal in Context**: Enforce a time limit for each round so the round progresses quickly and does not stall.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Timer Service, Game UI System  
**Trigger**: A new round starts.

### Success End Condition
* The round time limit is enforced and the round progresses when time expires.

### Failed End Condition
* The round time limit is not enforced and the round does not progress as expected.

### Preconditions
* The player is participating in an active match.
* The system is starting a new round.

### Main Success Scenario
1. The system starts a new round with a defined time limit.
2. The system starts the round timer and displays the remaining time to the player.
3. The player blends colors during the round.
4. The player submits a final blended color before the time limit expires.
5. The system accepts the submission and proceeds with round progression.

### Extensions
* **2a**: The system cannot start the round timer.  
  * **2a1**: The system displays an error message and prevents the round from proceeding.
* **4a**: The time limit expires before the player submits a color.  
  * **4a1**: The system prevents late submission and proceeds with round progression.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact time limit duration per round is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A new round begins in the Blend Colour game. The system starts the round with a defined time limit and begins a timer that is shown to the player as remaining time.

The player blends colors while watching the remaining time. Before the time limit expires, the player submits a final blended color. The system accepts the submission and proceeds with round progression so the game remains fast-paced.

### Alternative Scenario 2a — Round Timer Cannot Start
The system starts a new round and attempts to start the round timer. The timer cannot be started due to a system error.

The system displays an error message and prevents the round from proceeding. The player cannot continue the round without an enforced time limit.

### Alternative Scenario 4a — Time Expires Before Submission
The system starts the round timer and the player begins blending colors. The player does not submit a final blended color before the time limit expires.

When time expires, the system prevents any late submission and proceeds with round progression. The round continues without accepting a submission after the time limit.

---

## Acceptance Test Suite

### AT-UC-27-01 — Round Time Limit Enforced With On-Time Submission
**Covers**: Main Success Scenario

- **Given** a new round starts with a defined time limit  
- **When** the player submits a final blended color before time expires  
- **Then** the system accepts the submission  
  **And** proceeds with round progression

### AT-UC-27-02 — Round Timer Cannot Start
**Covers**: Extension 2a

- **Given** a new round is starting  
- **When** the system cannot start the round timer  
- **Then** the system displays an error message  
  **And** prevents the round from proceeding

### AT-UC-27-03 — Time Expires Before Submission
**Covers**: Extension 4a

- **Given** a round timer is running  
- **When** the time limit expires before the player submits a color  
- **Then** the system prevents late submission  
  **And** proceeds with round progression

### AT-UC-27-04 — No Submission Accepted After Expiry
**Covers**: All failure paths

- **Given** a round reaches time expiry or cannot start timing  
- **Then** no submission is accepted outside an enforced time limit

### AT-UC-27-05 — Time Limit Keeps Round Moving
**Covers**: Success End Condition

- **Given** a round has a defined time limit  
- **When** the time limit expires  
- **Then** the round progresses without waiting indefinitely for player submission

---

*UC-27 status: COMPLETE*

# UC-28 — View Countdown Timer

## Source User Story
**US-28**: As a player, I want to see a countdown timer so that I know how much time remains.

---

## Use Case (Cockburn Style)

**Goal in Context**: Display a countdown timer during a round so the player knows how much time remains.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Timer Service, Game UI System  
**Trigger**: A round begins and time tracking is active.

### Success End Condition
* The player can see an updating countdown timer showing the remaining time in the round.

### Failed End Condition
* The player cannot see the countdown timer and does not know how much time remains.

### Preconditions
* The player is participating in an active match.
* The round has a defined time limit and the round timer is running.

### Main Success Scenario
1. The system starts a new round with a defined time limit.
2. The system starts the round timer.
3. The system displays a countdown timer to the player.
4. The system updates the countdown timer as time decreases.
5. The player views the countdown timer while playing the round.

### Extensions
* **2a**: The system cannot start the round timer.  
  * **2a1**: The system displays an error message and does not display a countdown timer.
* **3a**: The system fails to display the countdown timer.  
  * **3a1**: The system displays an error message and prompts the player to retry viewing the timer.
* **4a**: The countdown timer stops updating during the round.  
  * **4a1**: The system displays an error message indicating the timer is unavailable.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The timer display format and update interval are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A new round begins in the Blend Colour game with a defined time limit. The system starts the round timer and displays a countdown timer to the player.

As the round continues, the system updates the countdown timer to reflect the remaining time. The player watches the timer while blending colors and making decisions within the round time limit.

### Alternative Scenario 2a — Round Timer Cannot Start
The system begins a new round and attempts to start the round timer. The timer cannot be started due to a system error.

The system displays an error message and does not display a countdown timer. The player cannot view remaining time for the round.

### Alternative Scenario 3a — Countdown Timer Not Displayed
The system starts the round timer but fails to display the countdown timer to the player due to a display error.

The system displays an error message and prompts the player to retry viewing the timer. The player cannot see the countdown timer until the display succeeds.

### Alternative Scenario 4a — Countdown Timer Stops Updating
The system displays the countdown timer at the start of the round. During the round, the countdown timer stops updating.

The system displays an error message indicating the timer is unavailable. The player no longer receives an accurate remaining-time display.

---

## Acceptance Test Suite

### AT-UC-28-01 — Countdown Timer Displayed and Updated
**Covers**: Main Success Scenario

- **Given** a round starts with a defined time limit and the timer is running  
- **When** the player is in the round  
- **Then** the system displays a countdown timer  
  **And** updates the countdown timer as time decreases

### AT-UC-28-02 — Round Timer Cannot Start
**Covers**: Extension 2a

- **Given** a new round is starting  
- **When** the system cannot start the round timer  
- **Then** the system displays an error message  
  **And** does not display a countdown timer

### AT-UC-28-03 — Countdown Timer Not Displayed
**Covers**: Extension 3a

- **Given** the round timer is running  
- **When** the system fails to display the countdown timer  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing the timer

### AT-UC-28-04 — Countdown Timer Stops Updating
**Covers**: Extension 4a

- **Given** the countdown timer is displayed  
- **When** the countdown timer stops updating during the round  
- **Then** the system displays an error message indicating the timer is unavailable

### AT-UC-28-05 — No Misleading Remaining-Time Display
**Covers**: All failure paths

- **Given** timer start, display, or update fails  
- **Then** the system does not show a misleading remaining-time value to the player

### AT-UC-28-06 — Countdown Timer Supports Time Awareness
**Covers**: Success End Condition

- **Given** the countdown timer is displayed to the player  
- **When** the player continues playing the round  
- **Then** the player can see how much time remains

---

*UC-28 status: COMPLETE*

# UC-29 — End Round Automatically on Time Expiry

## Source User Story
**US-29**: As a player, I want the round to end automatically when time expires so that gameplay proceeds smoothly.

---

## Use Case (Cockburn Style)

**Goal in Context**: Automatically end the round when the time limit expires so the match can proceed without delay.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Timer Service  
**Trigger**: The round timer reaches zero.

### Success End Condition
* The system ends the round automatically when time expires and proceeds with the next round step.

### Failed End Condition
* The system does not end the round on time expiry and gameplay does not proceed smoothly.

### Preconditions
* The player is participating in an active match.
* The current round has a defined time limit and the round timer is running.

### Main Success Scenario
1. The system starts a round with a defined time limit.
2. The system runs the round timer during gameplay.
3. The player blends colors during the round.
4. The round timer expires.
5. The system ends the round automatically.
6. The system proceeds with round progression.

### Extensions
* **2a**: The round timer is not running or cannot be monitored.  
  * **2a1**: The system displays an error message and does not end the round automatically.
* **5a**: The system encounters an error while ending the round.  
  * **5a1**: The system displays an error message and does not proceed with round progression.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The handling of players who have not submitted when time expires is not fully specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A round is in progress in the Blend Colour game with a defined time limit. The system runs a timer while players blend colors.

When the timer reaches zero, the system automatically ends the round. The system proceeds with the next step of round progression so gameplay continues smoothly without waiting for manual actions.

### Alternative Scenario 2a — Timer Not Running or Not Monitored
A round is started with a defined time limit, but the timer is not running properly or the system cannot monitor it.

The system displays an error message and does not end the round automatically on time expiry. Gameplay does not proceed as expected.

### Alternative Scenario 5a — Error Ending the Round
The timer expires during a round and the system attempts to end the round automatically. The system encounters an error while ending the round.

The system displays an error message and does not proceed with round progression. The round does not transition smoothly.

---

## Acceptance Test Suite

### AT-UC-29-01 — Round Ends Automatically on Time Expiry
**Covers**: Main Success Scenario

- **Given** a round is active with a running timer  
- **When** the timer reaches zero  
- **Then** the system ends the round automatically  
  **And** proceeds with round progression

### AT-UC-29-02 — Timer Not Running or Not Monitored
**Covers**: Extension 2a

- **Given** a round is active with a defined time limit  
- **When** the timer is not running or cannot be monitored  
- **Then** the system displays an error message  
  **And** does not end the round automatically

### AT-UC-29-03 — Error Ending the Round
**Covers**: Extension 5a

- **Given** the timer reaches zero during a round  
- **When** the system encounters an error while ending the round  
- **Then** the system displays an error message  
  **And** does not proceed with round progression

### AT-UC-29-04 — No Partial Round Transition
**Covers**: All failure paths

- **Given** the system cannot end the round automatically  
- **Then** the round does not partially transition into the next round state

### AT-UC-29-05 — Automatic End Enables Smooth Progression
**Covers**: Success End Condition

- **Given** a round has a defined time limit  
- **When** time expires  
- **Then** the system ends the round automatically so gameplay can proceed smoothly

---

*UC-29 status: COMPLETE*

# UC-30 — Submit Blended Color Before Time Ends

## Source User Story
**US-30**: As a player, I want to submit my blended color before the timer ends so that it counts for scoring.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to submit a blended color before the round timer ends so the submission is eligible for scoring.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Submission Service, Round Manager, Timer Service  
**Trigger**: The player selects submit for a blended color during an active timed round.

### Success End Condition
* The system accepts the player’s submission before time expiry and the submission is counted for scoring.

### Failed End Condition
* The system does not accept the submission in time and the submission does not count for scoring.

### Preconditions
* The player is participating in an active match.
* The current round is active with a running countdown timer.
* The player has a blended color ready to submit.

### Main Success Scenario
1. The player blends a color during the round.
2. The player selects submit before the round timer expires.
3. The system verifies that the round timer has not expired.
4. The system accepts the player’s blended color submission.
5. The system records the submission for scoring.
6. The system confirms that the submission has been received.

### Extensions
* **2a**: The player attempts to submit after the timer expires.  
  * **2a1**: The system rejects the submission and informs the player that time has expired.
* **3a**: The system cannot verify the timer state.  
  * **3a1**: The system displays an error message and does not accept the submission.
* **4a**: The system encounters an error while accepting or recording the submission.  
  * **4a1**: The system displays an error message and does not record the submission for scoring.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact behavior for submissions made at the exact moment of expiry is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player blends a color during a timed round in the Blend Colour game. Before the countdown reaches zero, the player selects submit to send their final blended color.

The system verifies that the timer has not expired, accepts the submission, and records it for scoring. The system confirms receipt so the player knows the submission will count.

### Alternative Scenario 2a — Submission After Time Expiry
The player waits too long and selects submit after the round timer has already expired.

The system rejects the submission and informs the player that time has expired. The submission does not count for scoring.

### Alternative Scenario 3a — Timer Verification Failure
The player selects submit before time should expire. The system attempts to verify that the round is still active but cannot verify the timer state due to an error.

The system displays an error message and does not accept the submission. The submission is not recorded for scoring.

### Alternative Scenario 4a — Submission Recording Error
The player selects submit in time and the system verifies the timer state. While accepting or recording the submission, the system encounters an error.

The system displays an error message and does not record the submission for scoring. The player’s submission does not count.

---

## Acceptance Test Suite

### AT-UC-30-01 — Submission Accepted Before Time Ends
**Covers**: Main Success Scenario

- **Given** a timed round is active and the player has a blended color ready  
- **When** the player submits before the timer expires  
- **Then** the system verifies the round is still active  
  **And** accepts the submission  
  **And** records the submission for scoring  
  **And** confirms receipt

### AT-UC-30-02 — Submission After Time Expiry
**Covers**: Extension 2a

- **Given** the round timer has expired  
- **When** the player attempts to submit a blended color  
- **Then** the system rejects the submission  
  **And** informs the player that time has expired

### AT-UC-30-03 — Timer Verification Failure
**Covers**: Extension 3a

- **Given** the player attempts to submit before time expires  
- **When** the system cannot verify the timer state  
- **Then** the system displays an error message  
  **And** does not accept the submission

### AT-UC-30-04 — Error Accepting or Recording Submission
**Covers**: Extension 4a

- **Given** the round is active and timer verification succeeds  
- **When** the system encounters an error accepting or recording the submission  
- **Then** the system displays an error message  
  **And** does not record the submission for scoring

### AT-UC-30-05 — No Partial Submission for Scoring
**Covers**: All failure paths

- **Given** a submission is rejected or fails to record  
- **Then** no partial submission exists that counts for scoring

### AT-UC-30-06 — On-Time Submission Counts for Scoring
**Covers**: Success End Condition

- **Given** the system accepts a submission before time expiry  
- **When** scoring is performed for the round  
- **Then** the submission is included in scoring

---

*UC-30 status: COMPLETE*

# UC-31 — Reject Late Submissions

## Source User Story
**US-31**: As a player, I want submissions made after the round timer expires to be rejected so that no one gains an unfair advantage.

---

## Use Case (Cockburn Style)

**Goal in Context**: Reject any color submission made after the round timer expires so all players follow the same time constraint.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Submission Service, Round Manager, Timer Service  
**Trigger**: The player attempts to submit a blended color after the round timer expires.

### Success End Condition
* Late submissions are rejected and do not count for scoring.

### Failed End Condition
* A late submission is accepted and may count for scoring, creating an unfair advantage.

### Preconditions
* The player is participating in an active match.
* The round timer has expired for the current round.
* The player attempts to submit a blended color.

### Main Success Scenario
1. The round timer expires for the current round.
2. The player attempts to submit a blended color.
3. The system verifies that the round timer has expired.
4. The system rejects the submission.
5. The system informs the player that the submission was rejected because time expired.

### Extensions
* **3a**: The system cannot verify the timer state.  
  * **3a1**: The system displays an error message and does not accept the submission.
* **4a**: The system encounters an error while rejecting the submission.  
  * **4a1**: The system displays an error message and does not record the submission for scoring.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact behavior for submissions arriving at the same instant as expiry is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A timed round ends when the countdown reaches zero. After time has expired, a player attempts to submit a blended color.

The system verifies that the timer has expired and rejects the submission. The system informs the player that the submission was rejected because time expired, ensuring that no late submission can provide an unfair advantage.

### Alternative Scenario 3a — Timer State Cannot Be Verified
After the timer expires, the player attempts to submit a blended color. The system attempts to verify the timer state but cannot confirm whether the timer has expired due to an error.

The system displays an error message and does not accept the submission. The submission does not count for scoring.

### Alternative Scenario 4a — Error While Rejecting Submission
The player attempts to submit after time has expired and the system verifies the expired timer state. While rejecting the submission, the system encounters an error.

The system displays an error message and does not record the submission for scoring. The player does not receive an accepted submission.

---

## Acceptance Test Suite

### AT-UC-31-01 — Late Submission Rejected
**Covers**: Main Success Scenario

- **Given** the round timer has expired  
- **When** the player attempts to submit a blended color  
- **Then** the system verifies the timer has expired  
  **And** rejects the submission  
  **And** informs the player the submission was rejected due to time expiry

### AT-UC-31-02 — Timer State Cannot Be Verified
**Covers**: Extension 3a

- **Given** the player attempts to submit after the round should be expired  
- **When** the system cannot verify the timer state  
- **Then** the system displays an error message  
  **And** does not accept the submission

### AT-UC-31-03 — Error While Rejecting Submission
**Covers**: Extension 4a

- **Given** the timer has expired and verification succeeds  
- **When** the system encounters an error while rejecting the submission  
- **Then** the system displays an error message  
  **And** does not record the submission for scoring

### AT-UC-31-04 — No Late Submission Counts for Scoring
**Covers**: All failure paths

- **Given** a submission occurs after time expiry or rejection fails  
- **Then** no late submission is included in scoring

### AT-UC-31-05 — Late Rejection Maintains Fairness
**Covers**: Success End Condition

- **Given** a submission is made after the timer expires  
- **When** the system processes the submission  
- **Then** the system rejects it so no player gains an unfair advantage

---

*UC-31 status: COMPLETE*

# UC-32 — Play Multiple Rounds in a Match

## Source User Story
**US-32**: As a player, I want to play multiple rounds in a match so that competition is meaningful.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a match to consist of multiple sequential rounds so overall competition is meaningful rather than determined by a single round.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Match Manager, Round Manager  
**Trigger**: A match is started.

### Success End Condition
* The match progresses through multiple rounds according to match rules.

### Failed End Condition
* The match does not progress through multiple rounds and ends prematurely.

### Preconditions
* The player is participating in an active match.
* The match configuration specifies more than one round.

### Main Success Scenario
1. The system starts a new match.
2. The system initializes the first round of the match.
3. The players complete the current round.
4. The system advances the match to the next round.
5. Steps 3–4 repeat until all rounds in the match are completed.
6. The system proceeds to match completion after the final round.

### Extensions
* **3a**: The system cannot complete a round due to an error.  
  * **3a1**: The system displays an error message and does not advance the match.
* **4a**: The system cannot advance to the next round.  
  * **4a1**: The system displays an error message and does not continue the match.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact number of rounds per match and advancement rules are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player starts a Blend Colour match that is configured to contain multiple rounds. The system initializes the first round and players complete it.

After the round ends, the system advances the match to the next round. This process repeats for each configured round. Once all rounds are completed, the system proceeds to match completion, ensuring the match outcome reflects performance across multiple rounds.

### Alternative Scenario 3a — Round Cannot Be Completed
During a match, the system encounters an error while running a round and cannot complete it.

The system displays an error message and does not advance the match to the next round. The match remains incomplete.

### Alternative Scenario 4a — Cannot Advance to Next Round
A round completes successfully, but the system encounters an error while attempting to advance the match to the next round.

The system displays an error message and does not continue the match. No further rounds are played.

---

## Acceptance Test Suite

### AT-UC-32-01 — Match Progresses Through Multiple Rounds
**Covers**: Main Success Scenario

- **Given** a match is configured with multiple rounds  
- **When** players complete a round  
- **Then** the system advances the match to the next round  
  **And** continues until all rounds are completed

### AT-UC-32-02 — Round Cannot Be Completed
**Covers**: Extension 3a

- **Given** a round is in progress during a match  
- **When** the system encounters an error completing the round  
- **Then** the system displays an error message  
  **And** does not advance the match

### AT-UC-32-03 — Cannot Advance to Next Round
**Covers**: Extension 4a

- **Given** a round has completed successfully  
- **When** the system fails to advance to the next round  
- **Then** the system displays an error message  
  **And** does not continue the match

### AT-UC-32-04 — No Partial Match Progression
**Covers**: All failure paths

- **Given** round completion or advancement fails  
- **Then** the match does not partially advance in an inconsistent state

### AT-UC-32-05 — Multiple Rounds Create Meaningful Competition
**Covers**: Success End Condition

- **Given** a match completes all configured rounds  
- **When** the match outcome is determined  
- **Then** the outcome reflects performance across multiple rounds

---

*UC-32 status: COMPLETE*

# UC-33 — View Round Results Before Next Round

## Source User Story
**US-33**: As a player, I want to view round results before the next round begins so that I can learn from them.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to view the results of a round before the match proceeds to the next round so the player can learn from performance.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Results Display Service, Round Manager  
**Trigger**: A round ends and results become available.

### Success End Condition
* The player can view round results before the next round begins.

### Failed End Condition
* The player cannot view round results before the next round begins.

### Preconditions
* The player is participating in an active match.
* A round has ended and results are available.

### Main Success Scenario
1. The system ends the current round and generates round results.
2. The system displays the round results to the player.
3. The player reviews the round results.
4. The system proceeds to start the next round after results viewing.

### Extensions
* **1a**: The system cannot generate round results.  
  * **1a1**: The system displays an error message and does not proceed to the next round.
* **2a**: The system fails to display the round results.  
  * **2a1**: The system displays an error message and prompts the player to retry viewing results.
* **4a**: The system starts the next round before results are viewed.  
  * **4a1**: The system displays an error message indicating results viewing was skipped.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The duration allowed for viewing results and whether players can advance early is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A round ends in a Blend Colour match and the system generates results for the round. The system displays the results to the player.

The player reviews the round results to understand how well they performed. After results viewing, the system proceeds to start the next round so the match can continue.

### Alternative Scenario 1a — Round Results Cannot Be Generated
A round ends and the system attempts to generate round results. The system encounters an error and cannot generate the results.

The system displays an error message and does not proceed to the next round. The player cannot view results for the round.

### Alternative Scenario 2a — Round Results Not Displayed
The system generates round results but fails to display them to the player due to a display error.

The system displays an error message and prompts the player to retry viewing results. The next round does not proceed through successful results viewing.

### Alternative Scenario 4a — Next Round Starts Before Results Are Viewed
A round ends and results are available, but the system starts the next round before the player has viewed the round results.

The system displays an error message indicating results viewing was skipped. The player does not get the opportunity to review results before the next round begins.

---

## Acceptance Test Suite

### AT-UC-33-01 — Round Results Shown Before Next Round
**Covers**: Main Success Scenario

- **Given** a round ends in an active match  
- **When** the system generates results for the round  
- **Then** the system displays the results to the player  
  **And** allows the player to review them before the next round begins

### AT-UC-33-02 — Round Results Cannot Be Generated
**Covers**: Extension 1a

- **Given** a round ends  
- **When** the system cannot generate round results  
- **Then** the system displays an error message  
  **And** does not proceed to the next round

### AT-UC-33-03 — Round Results Not Displayed
**Covers**: Extension 2a

- **Given** round results are generated  
- **When** the system fails to display the round results  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing results

### AT-UC-33-04 — Next Round Starts Before Results Viewed
**Covers**: Extension 4a

- **Given** round results are available  
- **When** the system starts the next round before results are viewed  
- **Then** the system displays an error message indicating results viewing was skipped

### AT-UC-33-05 — No Partial Progression Past Results Stage
**Covers**: All failure paths

- **Given** result generation, display, or results-stage sequencing fails  
- **Then** the match does not progress in a partially completed results state

### AT-UC-33-06 — Results Available for Learning
**Covers**: Success End Condition

- **Given** the player views the round results  
- **When** the next round begins  
- **Then** the player has had access to the prior round results for learning

---

*UC-33 status: COMPLETE*

# UC-34 — View All Submitted Colors After a Round

## Source User Story
**US-34**: As a player, I want to see all submitted colors after a round so that I can compare outcomes.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to view all players’ submitted colors after a round ends so outcomes can be compared.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Results Display Service, Submission Service, Round Manager  
**Trigger**: A round ends and submissions are finalized.

### Success End Condition
* The player can view all submitted colors for the round.

### Failed End Condition
* The player cannot view all submitted colors for the round.

### Preconditions
* The player is participating in an active match.
* A round has ended and submissions for the round are finalized.

### Main Success Scenario
1. The system ends the current round and finalizes player submissions.
2. The system collects the submitted colors for all players in the round.
3. The system displays all submitted colors to the player.
4. The player reviews the submitted colors to compare outcomes.

### Extensions
* **1a**: The system cannot finalize submissions for the round.  
  * **1a1**: The system displays an error message and does not display submitted colors.
* **2a**: The system cannot retrieve one or more submitted colors.  
  * **2a1**: The system displays an error message and does not display the submitted colors list.
* **3a**: The system fails to display the submitted colors.  
  * **3a1**: The system displays an error message and prompts the player to retry viewing submissions.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: Whether late or missing submissions appear as placeholders is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A round ends in a Blend Colour match and the system finalizes the player submissions for the round. The system collects the submitted colors from all players.

The system displays all submitted colors to the player. The player reviews the submissions to compare outcomes across players and understand how different blends matched the target color.

### Alternative Scenario 1a — Submissions Cannot Be Finalized
The round ends and the system attempts to finalize submissions. The system encounters an error and cannot finalize submissions for the round.

The system displays an error message and does not display submitted colors. The player cannot compare outcomes for the round.

### Alternative Scenario 2a — Submitted Colors Cannot Be Retrieved
The system finalizes submissions and attempts to collect submitted colors. One or more submitted colors cannot be retrieved due to a retrieval or storage error.

The system displays an error message and does not display the submitted colors list. The player cannot view all submissions.

### Alternative Scenario 3a — Submitted Colors Not Displayed
The system collects all submitted colors but fails to display them to the player due to a display error.

The system displays an error message and prompts the player to retry viewing submissions. The player cannot view the list until the display succeeds.

---

## Acceptance Test Suite

### AT-UC-34-01 — All Submitted Colors Displayed After Round
**Covers**: Main Success Scenario

- **Given** a round ends and submissions are finalized  
- **When** the player views round results  
- **Then** the system displays all submitted colors for the round  
  **And** the player can review them for comparison

### AT-UC-34-02 — Submissions Cannot Be Finalized
**Covers**: Extension 1a

- **Given** a round has ended  
- **When** the system cannot finalize submissions for the round  
- **Then** the system displays an error message  
  **And** does not display submitted colors

### AT-UC-34-03 — Submitted Colors Cannot Be Retrieved
**Covers**: Extension 2a

- **Given** submissions are finalized  
- **When** the system cannot retrieve one or more submitted colors  
- **Then** the system displays an error message  
  **And** does not display the submitted colors list

### AT-UC-34-04 — Submitted Colors Not Displayed
**Covers**: Extension 3a

- **Given** submitted colors are available to display  
- **When** the system fails to display the submitted colors  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing submissions

### AT-UC-34-05 — No Partial Submitted Colors List
**Covers**: All failure paths

- **Given** submission finalization, retrieval, or display fails  
- **Then** no partial or misleading submitted colors list is displayed

### AT-UC-34-06 — Submitted Colors Available for Comparison
**Covers**: Success End Condition

- **Given** the system displays all submitted colors after the round  
- **When** the player reviews the results  
- **Then** the player can compare outcomes across submissions

---

*UC-34 status: COMPLETE*

# UC-35 — Highlight Winning Color and Player

## Source User Story
**US-35**: As a player, I want the winning color/player to be highlighted so that the result is clear.

---

## Use Case (Cockburn Style)

**Goal in Context**: Clearly communicate the outcome of a completed round by highlighting the winning color and the winning player in the results view.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Results Display Service, Round Manager  
**Trigger**: A round ends and the results are shown.

### Success End Condition
* The system displays the round results with the winning color and winning player clearly highlighted.

### Failed End Condition
* The system displays the round results without a clear indication of the winner.

### Preconditions
* A round has ended.
* The system has determined the round outcome according to game rules.

### Main Success Scenario
1. A round ends and the system transitions to the results view.
2. The system determines the winning color and the winning player.
3. The system displays the round results.
4. The system highlights the winning color.
5. The system highlights the winning player.
6. The player views the highlighted result.

### Extensions
* **2a**: The round outcome results in a tie.  
  * **2a1**: The system identifies all winning colors and players.  
  * **2a2**: The system highlights each winning color and each winning player and indicates that the round ended in a tie.
* **3a**: The system cannot determine a valid winner at the end of the round.  
  * **3a1**: The system displays a message indicating that the round result is unavailable.  
  * **3a2**: The system does not highlight any color or player.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The visual style of highlighting is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A round of the Blend Colour game ends and the system transitions to the results view. The system determines the winning color and the winning player based on the game rules.

The system displays the round results and highlights the winning color and the winning player. The player can immediately identify the winner without needing to interpret additional information.

### Alternative Scenario 2a — Round Ends in a Tie
A round ends and the system determines that multiple players share the winning outcome.

The system highlights each winning color and each winning player and displays an indication that the round ended in a tie. The player understands that there is no single winner for the round.

### Alternative Scenario 3a — Winner Cannot Be Determined
A round ends but the system cannot determine a valid winner.

The system displays a message indicating that the round result is unavailable and does not highlight any color or player. The player understands that the outcome cannot be shown.

---

## Acceptance Test Suite

### AT-UC-35-01 — Winner Highlighted After Round
**Covers**: Main Success Scenario

- **Given** a round has ended  
- **When** the results view is displayed  
- **Then** the winning color is highlighted  
  **And** the winning player is highlighted

### AT-UC-35-02 — Tie Highlights All Winners
**Covers**: Extension 2a

- **Given** a round ends in a tie  
- **When** the results view is displayed  
- **Then** all winning colors and players are highlighted  
  **And** a tie indication is shown

### AT-UC-35-03 — Winner Cannot Be Determined
**Covers**: Extension 3a

- **Given** a round has ended  
- **When** the system cannot determine a valid winner  
- **Then** no color or player is highlighted  
  **And** a result-unavailable message is displayed

### AT-UC-35-04 — No Incorrect Winner Highlight
**Covers**: All failure paths

- **Given** the system cannot determine a valid winner  
- **Then** no incorrect winner highlight is displayed

### AT-UC-35-05 — Winner Highlight Makes Result Clear
**Covers**: Success End Condition

- **Given** the results view is displayed  
- **When** the system highlights the winner  
- **Then** the winning color and winning player are clearly identifiable  
  **And** non-winners are not highlighted

---

*UC-35 status: COMPLETE*

# UC-36 — View Exact Target Color After Scoring

## Source User Story
**US-36**: As a player, I want to see the exact target color after scoring so that I understand the difference.

---

## Use Case (Cockburn Style)

**Goal in Context**: Help a player understand the scoring outcome by displaying the exact target color used for comparison after scoring is completed.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Results Display Service  
**Trigger**: A round is scored and the system shows the scoring results.

### Success End Condition
* The system displays the scoring results and shows the exact target color used for scoring.

### Failed End Condition
* The system displays scoring results but does not show the exact target color.

### Preconditions
* A round has ended.
* The system has completed scoring for the round.

### Main Success Scenario
1. A round ends and the system completes scoring.
2. The system transitions to the scoring results view.
3. The system retrieves the exact target color used for scoring the round.
4. The system displays the scoring results.
5. The system displays the exact target color value in the results view.
6. The player views the exact target color to understand the difference.

### Extensions
* **3a**: The system cannot retrieve the exact target color.  
  * **3a1**: The system displays a message indicating the target color is unavailable for this round.  
  * **3a2**: The system displays the scoring results without showing a target color.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: How the target color is represented (swatch only vs. swatch plus numeric value) is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A round ends and the system completes scoring. The system transitions to the scoring results view and retrieves the exact target color that was used when calculating scores.

The system displays the scoring results and shows the exact target color in the results view. The player uses the target color to understand how their submitted color differed from the goal.

### Alternative Scenario 3a — Target Color Cannot Be Retrieved
A round ends and the system completes scoring. The system transitions to the scoring results view but cannot retrieve the exact target color for the round.

The system displays a message indicating the target color is unavailable and displays the scoring results without a target color. The player can still see the scores, but cannot compare their submission to the exact target color.

---

## Acceptance Test Suite

### AT-UC-36-01 — Target Color Displayed After Scoring
**Covers**: Main Success Scenario

- **Given** a round has ended and scoring is complete  
- **When** the results view is displayed  
- **Then** the system displays the exact target color used for scoring  
  **And** the player can view it alongside scoring results

### AT-UC-36-02 — Target Color Unavailable
**Covers**: Extension 3a

- **Given** scoring is complete  
- **When** the system cannot retrieve the exact target color  
- **Then** the system displays a target-unavailable message  
  **And** does not display a target color value

### AT-UC-36-03 — No Incorrect Target Color Displayed
**Covers**: All failure paths

- **Given** the system cannot retrieve the exact target color  
- **Then** the system does not display an incorrect or stale target color

### AT-UC-36-04 — Target Color Supports Understanding Difference
**Covers**: Success End Condition

- **Given** the results view displays the exact target color after scoring  
- **When** the player reviews the results  
- **Then** the player can use the target color to understand the difference from their submitted color

---

*UC-36 status: COMPLETE*

# UC-37 — View Visual Feedback for Color Accuracy

## Source User Story
**US-37**: As a player, I want visual feedback showing how close my color was to the target so that improvement is possible.

---

## Use Case (Cockburn Style)

**Goal in Context**: Help a player improve by visually communicating how close their submitted color was to the target color after scoring.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Results Display Service  
**Trigger**: A round is scored and the system presents scoring feedback.

### Success End Condition
* The system displays visual feedback that clearly indicates how close the player’s submitted color was to the target color.

### Failed End Condition
* The system displays scoring results without visual feedback indicating color closeness.

### Preconditions
* A round has ended.
* The system has completed scoring for the round.
* The player submitted a color for the round.

### Main Success Scenario
1. A round ends and the system completes scoring.
2. The system transitions to the scoring results view.
3. The system determines the distance or difference between the player’s submitted color and the target color.
4. The system displays the scoring results.
5. The system displays visual feedback representing how close the player’s color was to the target.
6. The player views the visual feedback to understand their performance.

### Extensions
* **3a**: The system cannot compute the color difference for the player’s submission.  
  * **3a1**: The system displays a message indicating that visual feedback is unavailable for this round.  
  * **3a2**: The system displays scoring results without visual feedback.
* **5a**: The player did not submit a color for the round.  
  * **5a1**: The system displays a message indicating that no submission was made.  
  * **5a2**: The system does not display visual feedback.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The exact form of visual feedback (bar, gradient, numeric indicator) is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A round ends and the system completes scoring. The system transitions to the scoring results view and determines how close the player’s submitted color was to the target color.

The system displays the scoring results along with visual feedback that represents the closeness between the player’s color and the target. The player uses this feedback to understand their accuracy and identify areas for improvement.

### Alternative Scenario 3a — Color Difference Cannot Be Computed
A round ends and scoring is completed. The system attempts to compute the difference between the player’s submitted color and the target color but cannot do so.

The system displays a message indicating that visual feedback is unavailable for this round and shows the scoring results without visual feedback. The player understands that detailed feedback cannot be provided.

### Alternative Scenario 5a — No Color Submission
A round ends and scoring is completed, but the player did not submit a color.

The system displays a message indicating that no submission was made and does not display visual feedback. The player understands why no feedback is shown.

---

## Acceptance Test Suite

### AT-UC-37-01 — Visual Feedback Displayed After Scoring
**Covers**: Main Success Scenario

- **Given** a round has ended and scoring is complete  
- **When** the results view is displayed  
- **Then** the system displays visual feedback indicating how close the player’s color was to the target  
  **And** the player can view it alongside scoring results

### AT-UC-37-02 — Visual Feedback Unavailable
**Covers**: Extension 3a

- **Given** scoring is complete  
- **When** the system cannot compute the color difference  
- **Then** the system displays a visual-feedback-unavailable message  
  **And** does not display visual feedback

### AT-UC-37-03 — No Submission Means No Feedback
**Covers**: Extension 5a

- **Given** scoring is complete  
- **When** the player did not submit a color  
- **Then** the system displays a no-submission message  
  **And** does not display visual feedback

### AT-UC-37-04 — No Incorrect Visual Feedback Displayed
**Covers**: All failure paths

- **Given** visual feedback cannot be displayed  
- **Then** the system does not display incorrect or misleading feedback

### AT-UC-37-05 — Visual Feedback Supports Improvement
**Covers**: Success End Condition

- **Given** visual feedback is displayed after scoring  
- **When** the player reviews the results  
- **Then** the player can understand how close their color was to the target

---

*UC-37 status: COMPLETE*

# UC-38 — Synchronize Game State Across Players

## Source User Story
**US-38**: As a player, I want all players to receive the same game state from the server so that gameplay is synchronized.

---

## Use Case (Cockburn Style)

**Goal in Context**: Keep gameplay synchronized by ensuring the server distributes a consistent game state to all players in a match.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Game Server, Game State Service, Client App  
**Trigger**: The server advances the match state (e.g., phase change, timer tick, submission received, scoring completed).

### Success End Condition
* All connected players receive and display the same authoritative game state for the match.

### Failed End Condition
* One or more players do not receive the current authoritative game state, resulting in unsynchronized gameplay.

### Preconditions
* A match is active on the server.
* Players are connected to the match.

### Main Success Scenario
1. The server advances the match to a new authoritative game state.
2. The server generates a game state update message for the match.
3. The server broadcasts the same game state update to all connected players in the match.
4. Each client receives the update and replaces its local game state with the server-provided state.
5. Each client displays the updated state to the player.
6. The players continue gameplay with synchronized state.

### Extensions
* **3a**: One or more clients do not acknowledge receipt of the update within a configured time window.  
  * **3a1**: The server retries sending the same game state update to the affected client(s).  
  * **3a2**: If the client(s) remain unresponsive, the server marks them as disconnected and continues broadcasting to remaining connected players.
* **4a**: A client receives an out-of-order or stale update.  
  * **4a1**: The client detects the stale update using the update sequence/version.  
  * **4a2**: The client discards the stale update and requests the latest authoritative state from the server.
* **4b**: A client’s local state conflicts with the server-provided state.  
  * **4b1**: The client overwrites its local state with the server-provided state.  
  * **4b2**: The client logs or flags the desynchronization event for diagnostics.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The precise transport and reliability mechanism (WebSocket, polling, etc.) and the reconciliation strategy are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
During an active match, the server advances the match state, such as moving to a new phase or updating the timer. The server creates a game state update that represents the authoritative state for the match.

The server broadcasts the same update to every connected player. Each client receives the update, replaces its local state with the server-provided state, and displays the updated state. All players see the same game state and gameplay remains synchronized.

### Alternative Scenario 3a — Client Does Not Acknowledge Update
The server advances the match state and broadcasts the update. One or more clients do not acknowledge receipt of the update within the configured time window.

The server retries sending the same update to the affected client(s). If the client(s) remain unresponsive, the server marks them as disconnected and continues broadcasting updates to the remaining connected players. The connected players continue with synchronized gameplay.

### Alternative Scenario 4a — Client Receives Out-of-Order Update
The server broadcasts a new game state update. A client receives an older update after a newer one, or receives an update that is stale.

The client detects the out-of-order update using a sequence or version value, discards it, and requests the latest authoritative state from the server. The client then applies the latest state so it matches the other players.

### Alternative Scenario 4b — Client State Conflicts With Server State
The server broadcasts an authoritative game state update. A client detects that its current local state conflicts with the server-provided state.

The client overwrites its local state with the server-provided state and records the desynchronization event for diagnostics. The player’s client returns to the authoritative synchronized state.

---

## Acceptance Test Suite

### AT-UC-38-01 — Same State Update Delivered to All Players
**Covers**: Main Success Scenario

- **Given** a match is active and multiple players are connected  
- **When** the server advances the match state  
- **Then** the server broadcasts the same authoritative game state update to all connected players  
  **And** each client applies the update and displays the same state

### AT-UC-38-02 — Retry and Disconnect Unresponsive Clients
**Covers**: Extension 3a

- **Given** the server broadcasts a game state update  
- **When** a client does not acknowledge receipt within the configured time window  
- **Then** the server retries sending the same update to that client  
  **And** marks the client disconnected if it remains unresponsive  
  **And** continues broadcasting updates to remaining connected players

### AT-UC-38-03 — Discard Stale Updates and Fetch Latest State
**Covers**: Extension 4a

- **Given** a client receives game state updates with sequence/version values  
- **When** the client receives an out-of-order or stale update  
- **Then** the client discards the stale update  
  **And** requests the latest authoritative state  
  **And** applies the latest state after receiving it

### AT-UC-38-04 — Resolve Conflicting Local State Using Server Authority
**Covers**: Extension 4b

- **Given** a client has a local state that conflicts with the server-provided state  
- **When** the client receives the authoritative state update  
- **Then** the client overwrites its local state with the server-provided state  
  **And** the displayed state matches the authoritative state

### AT-UC-38-05 — No Partial Synchronization Guarantees
**Covers**: All failure paths

- **Given** one or more clients fail to receive or apply the current authoritative game state  
- **Then** the system does not treat the match as fully synchronized  
  **And** performs the defined recovery behavior (retry, resync request, or disconnect)

### AT-UC-38-06 — Synchronized Gameplay Maintained
**Covers**: Success End Condition

- **Given** all connected players have applied the latest authoritative game state  
- **When** gameplay continues to the next interaction  
- **Then** all connected players observe the same match phase and relevant round data

---

*UC-38 status: COMPLETE*

# UC-39 — Start Match When Enough Players Have Joined

## Source User Story
**US-39**: As a player, I want the game to start only when enough players have joined so that the match is fair. If in a room, if single then you can choose single mode.

---

## Use Case (Cockburn Style)

**Goal in Context**: Ensure fair gameplay by starting multiplayer matches only when enough players have joined, while allowing immediate play in single-player mode.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Room Service, Match Manager, Game Server  
**Trigger**: A player attempts to start a match or selects single-player mode.

### Success End Condition
* In a room, the match starts only when the minimum required number of players have joined; in single-player mode, the match starts immediately.

### Failed End Condition
* The multiplayer match starts without enough players, or the system prevents a valid match start.

### Preconditions
* The player is in a multiplayer room or on the mode selection/start screen.
* The system has a configured minimum player requirement for multiplayer rooms.

### Main Success Scenario
1. The player is in a multiplayer room and chooses to start the match.
2. The system checks the current number of players in the room.
3. The system determines that the minimum required number of players has joined.
4. The system starts the match for all players in the room.
5. The system transitions all players to the first match phase.
6. The players begin gameplay.

### Extensions
* **1a**: The player selects single-player mode instead of starting a multiplayer match.  
  * **1a1**: The system starts a single-player match immediately and transitions the player to the first match phase.
* **2a**: The system cannot confirm the current number of players in the room.  
  * **2a1**: The system does not start the match and informs the player that the room status is unavailable.
* **3a**: The room does not have enough players.  
  * **3a1**: The system does not start the match and informs the player that more players are required.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The exact minimum player count required for fairness is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is in a multiplayer room and chooses to start the match. The system checks how many players are currently in the room and compares this number against the configured minimum.

The system determines that enough players have joined. The system starts the match and transitions all players in the room into the first match phase. Gameplay begins fairly for all participants.

### Alternative Scenario 1a — Player Chooses Single-Player Mode
A player chooses single-player mode rather than starting a multiplayer match.

The system starts a single-player match immediately and transitions the player into the first match phase. The player begins gameplay without waiting for others.

### Alternative Scenario 2a — Player Count Cannot Be Confirmed
A player attempts to start a multiplayer match. The system cannot confirm the current number of players in the room.

The system does not start the match and informs the player that the room status is unavailable. The player remains in the room and can retry later.

### Alternative Scenario 3a — Not Enough Players in Room
A player attempts to start a multiplayer match, but the room does not yet have enough players.

The system does not start the match and informs the player that more players are required. The player waits for additional players to join.

---

## Acceptance Test Suite

### AT-UC-39-01 — Start Multiplayer Match When Minimum Players Met
**Covers**: Main Success Scenario

- **Given** a player is in a multiplayer room  
  **And** the room has at least the configured minimum number of players  
- **When** the player starts the match  
- **Then** the system starts the match for all players in the room  
  **And** transitions all players to the first match phase

### AT-UC-39-02 — Start Single-Player Match Immediately
**Covers**: Extension 1a

- **Given** a player selects single-player mode  
- **When** the player starts the match  
- **Then** the system starts a single-player match immediately  
  **And** transitions the player to the first match phase

### AT-UC-39-03 — Cannot Confirm Room Player Count
**Covers**: Extension 2a

- **Given** a player is in a multiplayer room  
- **When** the system cannot confirm the room player count  
- **Then** the system does not start the match  
  **And** informs the player that the room status is unavailable

### AT-UC-39-04 — Prevent Start When Not Enough Players
**Covers**: Extension 3a

- **Given** a player is in a multiplayer room  
  **And** the room has fewer than the configured minimum number of players  
- **When** the player attempts to start the match  
- **Then** the system does not start the match  
  **And** informs the player that more players are required

### AT-UC-39-05 — No Incorrect Match Start
**Covers**: All failure paths

- **Given** the system cannot confirm player count or the room does not have enough players  
- **Then** the system does not start the multiplayer match

### AT-UC-39-06 — Fair Start Enforced
**Covers**: Success End Condition

- **Given** a multiplayer match starts  
- **When** gameplay begins  
- **Then** the room had at least the configured minimum number of players at start time  
  **And** all players were transitioned into the match together

---

*UC-39 status: COMPLETE*

# UC-40 — Handle Player Leaving Mid-Round

## Source User Story
**US-40**: As a player, I want the game to handle players leaving mid-round so that others can continue playing.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a match to continue smoothly when one or more players leave during an active round.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Game Server, Match Manager, Room Service  
**Trigger**: A player disconnects or leaves while a round is in progress.

### Success End Condition
* Remaining players continue the round or match without disruption after a player leaves.

### Failed End Condition
* The round or match becomes blocked or ends incorrectly due to a player leaving.

### Preconditions
* A multiplayer match is active.
* A round is currently in progress.

### Main Success Scenario
1. A player leaves or disconnects during an active round.
2. The server detects that the player has left the match.
3. The system removes the leaving player from the active round.
4. The system updates the game state for the remaining players.
5. The system allows the round to continue for the remaining players.
6. The remaining players continue gameplay without interruption.

### Extensions
* **1a**: The leaving player had already submitted an action for the round.  
  * **1a1**: The system preserves the submitted action and continues the round.
* **1b**: The leaving player had not yet submitted an action for the round.  
  * **1b1**: The system marks the player as inactive and continues the round without their input.
* **5a**: The number of remaining players falls below the minimum required to continue the match.  
  * **5a1**: The system ends the match and informs the remaining players.

### Related Information
* **Priority**: High  
* **Frequency**: Medium  
* **Open Issues**: The exact rules for scoring or penalties when a player leaves mid-round are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
During an active round, a player leaves the match or disconnects unexpectedly. The server detects the departure and removes the player from the active round.

The system updates the game state for the remaining players and allows the round to continue. The remaining players proceed with gameplay without being blocked by the missing player.

### Alternative Scenario 1a — Player Leaves After Submitting
A player leaves the match after submitting their action for the round.

The system preserves the submitted action and continues the round using that input. The remaining players continue gameplay without interruption.

### Alternative Scenario 1b — Player Leaves Before Submitting
A player leaves the match before submitting an action for the round.

The system marks the player as inactive and continues the round without waiting for input from that player. The remaining players continue gameplay.

### Alternative Scenario 5a — Too Few Players Remain
A player leaves the match, causing the number of remaining players to fall below the minimum required to continue.

The system ends the match and informs the remaining players that the match cannot continue. Gameplay does not proceed further.

---

## Acceptance Test Suite

### AT-UC-40-01 — Continue Round When Player Leaves
**Covers**: Main Success Scenario

- **Given** a round is in progress  
- **When** a player leaves the match  
- **Then** the system removes the player from the active round  
  **And** allows the remaining players to continue gameplay

### AT-UC-40-02 — Preserve Submitted Action
**Covers**: Extension 1a

- **Given** a player has submitted an action for the round  
- **When** the player leaves before the round ends  
- **Then** the system preserves the submitted action  
  **And** continues the round using that action

### AT-UC-40-03 — Skip Missing Player Input
**Covers**: Extension 1b

- **Given** a player has not submitted an action  
- **When** the player leaves mid-round  
- **Then** the system does not wait for that player  
  **And** continues the round for remaining players

### AT-UC-40-04 — End Match When Too Few Players Remain
**Covers**: Extension 5a

- **Given** a round is in progress  
- **When** a player leaves and the remaining player count falls below the minimum  
- **Then** the system ends the match  
  **And** informs the remaining players

### AT-UC-40-05 — No Blocked Gameplay After Player Leaves
**Covers**: All failure paths

- **Given** a player leaves during a round  
- **Then** the system does not block remaining players from continuing or concluding the round

### AT-UC-40-06 — Match Continuity Maintained
**Covers**: Success End Condition

- **Given** a player leaves mid-round  
- **When** the round continues or ends appropriately  
- **Then** remaining players are not prevented from completing gameplay

---

*UC-40 status: COMPLETE*

# UC-41 — Lock Lobby Once Match Starts

## Source User Story
**US-41**: As a player, I want the lobby to be locked against new players joining once a game starts so that fairness and synchronization are preserved.

---

## Use Case (Cockburn Style)

**Goal in Context**: Preserve fairness and synchronized gameplay by preventing new players from joining a room once the match has started.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Room Service, Match Manager, Game Server  
**Trigger**: A match starts in a room, or a new player attempts to join a room with an active match.

### Success End Condition
* The room is locked once the match starts and new join attempts are rejected while the match is active.

### Failed End Condition
* A new player joins after the match has started, or valid join attempts are rejected when the match is not active.

### Preconditions
* A room exists.
* The system supports multiplayer matches started from a room.

### Main Success Scenario
1. Players are gathered in a room and start a match.
2. The system marks the room as locked for new joins.
3. A new player attempts to join the room.
4. The system rejects the join attempt and informs the player that the match is in progress.
5. The current players continue gameplay with a fixed participant set.

### Extensions
* **1a**: The match ends and the room becomes available for new players again.  
  * **1a1**: The system unlocks the room for new joins.
* **3a**: A disconnected player from the match attempts to rejoin.  
  * **3a1**: The system allows rejoin if the player is an original match participant and the match is still active.
* **3b**: A join attempt is made when no match is active.  
  * **3b1**: The system allows the player to join the room.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: Whether rejoining requires a token/session and how long rejoin is permitted are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
Players gather in a room and start a match. Once the match begins, the system locks the room so the set of participants cannot change.

A new player attempts to join the room while the match is in progress. The system rejects the join attempt and informs the player that the match is already in progress. The current players continue gameplay without disruption and remain synchronized.

### Alternative Scenario 1a — Room Unlocks After Match Ends
A match ends in the room. The system updates the room status.

The system unlocks the room, allowing new players to join again for the next match.

### Alternative Scenario 3a — Disconnected Player Rejoins
A player who was part of the match disconnects and attempts to rejoin while the match is still active.

The system recognizes the player as an original participant and allows the player to rejoin the room and resume synchronized gameplay.

### Alternative Scenario 3b — Join Attempt When No Match Is Active
A player attempts to join a room when there is no active match.

The system allows the player to join the room as normal.

---

## Acceptance Test Suite

### AT-UC-41-01 — Reject New Joins After Match Starts
**Covers**: Main Success Scenario

- **Given** a match has started in a room  
- **When** a new player attempts to join the room  
- **Then** the system rejects the join attempt  
  **And** informs the player that the match is in progress

### AT-UC-41-02 — Room Unlocks After Match Ends
**Covers**: Extension 1a

- **Given** a match has ended in a room  
- **When** the room status updates  
- **Then** the room is unlocked for new joins

### AT-UC-41-03 — Allow Original Player to Rejoin During Active Match
**Covers**: Extension 3a

- **Given** a match is active in a room  
  **And** a disconnected player was an original participant  
- **When** the player attempts to rejoin  
- **Then** the system allows the player to rejoin

### AT-UC-41-04 — Allow Join When No Match Is Active
**Covers**: Extension 3b

- **Given** no match is active in a room  
- **When** a player attempts to join  
- **Then** the system allows the player to join the room

### AT-UC-41-05 — No Incorrect Joins While Locked
**Covers**: All failure paths

- **Given** the room is locked due to an active match  
- **Then** the system does not allow a non-participant to join during the match

### AT-UC-41-06 — Fixed Participant Set Preserved
**Covers**: Success End Condition

- **Given** a match starts in a room  
- **When** join attempts occur during the match  
- **Then** only the original participants remain in the match  
  **And** gameplay remains fair and synchronized

---

*UC-41 status: COMPLETE*

# UC-42 — Queue Late Joiners Until Next Game

## Source User Story
**US-42**: As a player, I want players who join a room after a game has started to wait until the next game begins so that ongoing rounds are not affected.

---

## Use Case (Cockburn Style)

**Goal in Context**: Protect ongoing rounds by placing late joiners into a waiting state until the next game begins.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Room Service, Match Manager, Game Server  
**Trigger**: A player attempts to join a room that has an active game.

### Success End Condition
* A player who joins after a game has started is placed in a waiting state and is admitted only when the next game begins.

### Failed End Condition
* A late joiner is added to the active game, or the system prevents the player from joining the room in a waiting state when it should be allowed.

### Preconditions
* A room exists.
* The system supports multiplayer games started from a room.

### Main Success Scenario
1. A game is active in a room.
2. A player attempts to join the room.
3. The system detects that a game is already in progress.
4. The system adds the player to the room in a waiting state for the next game.
5. The system informs the player that they will join when the next game begins.
6. The active game continues without including the waiting player.

### Extensions
* **3a**: No game is active when the player attempts to join.  
  * **3a1**: The system adds the player to the room as an active participant for the next game start.
* **4a**: The next game begins.  
  * **4a1**: The system admits all waiting players into the participant set for the new game.  
  * **4a2**: The system transitions admitted players to the first phase of the new game.
* **4b**: The system cannot place the player into the waiting state.  
  * **4b1**: The system informs the player that the join request cannot be processed and does not add them to the active game.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: Whether waiting players can spectate the current game and what information they can see is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A game is already in progress in a room. A player attempts to join the room while rounds are ongoing. The system detects that the game is active and does not add the player to the current participant set.

Instead, the system adds the player to the room in a waiting state for the next game and informs them that they will join when the next game begins. The active game continues without being affected by the late join.

### Alternative Scenario 3a — No Active Game
A player attempts to join a room and there is no active game in progress.

The system adds the player to the room as an active participant for the next game start. The player does not need to wait for a next-game transition.

### Alternative Scenario 4a — Next Game Begins
One or more players are waiting in the room while the current game finishes. When the next game begins, the system updates the participant set.

The system admits all waiting players into the new game and transitions them into the first phase of the new game. The newly admitted players participate starting with the next game only.

### Alternative Scenario 4b — Cannot Place Player in Waiting State
A player attempts to join a room during an active game. The system detects that the game is in progress but cannot place the player into the waiting state.

The system informs the player that the join request cannot be processed and does not add the player to the active game. The ongoing rounds are not affected.

---

## Acceptance Test Suite

### AT-UC-42-01 — Late Joiner Waits Until Next Game
**Covers**: Main Success Scenario

- **Given** a game is active in a room  
- **When** a player attempts to join the room  
- **Then** the system adds the player in a waiting state  
  **And** informs the player they will join the next game  
  **And** the active game continues without including the player

### AT-UC-42-02 — Join When No Game Is Active
**Covers**: Extension 3a

- **Given** no game is active in a room  
- **When** a player attempts to join the room  
- **Then** the system adds the player to the room as an active participant

### AT-UC-42-03 — Admit Waiting Players When Next Game Begins
**Covers**: Extension 4a

- **Given** one or more players are in a waiting state in a room  
- **When** the next game begins  
- **Then** the system admits the waiting players into the new game participant set  
  **And** transitions them to the first phase of the new game

### AT-UC-42-04 — Cannot Queue Player Does Not Affect Active Game
**Covers**: Extension 4b

- **Given** a game is active in a room  
- **When** the system cannot place a joining player into the waiting state  
- **Then** the system informs the player the join cannot be processed  
  **And** does not add the player to the active game

### AT-UC-42-05 — No Late Joiners Added to Active Game
**Covers**: All failure paths

- **Given** a game is active in a room  
- **Then** the system does not add any late joiner to the current game participant set

### AT-UC-42-06 — Ongoing Rounds Not Affected by Late Joiners
**Covers**: Success End Condition

- **Given** a game is active and late joiners are placed in a waiting state  
- **When** the active game continues through its rounds  
- **Then** the participant set for the active game remains unchanged  
  **And** late joiners participate starting with the next game only

---

*UC-42 status: COMPLETE*

# UC-43 — Choose Single-Player or Multiplayer Mode

## Source User Story
**US-43**: As a player, I want to choose between single-player mode and multiplayer mode so that I can play alone or with others.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to select the desired gameplay mode (single-player or multiplayer) before starting a game.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Mode Selection UI, Room Service, Match Manager  
**Trigger**: The player opens the game start screen and chooses a play mode.

### Success End Condition
* The player successfully enters the selected mode: a single-player game starts, or the player enters a multiplayer room flow.

### Failed End Condition
* The player cannot select a mode or the system cannot start the selected mode.

### Preconditions
* The player is at the game start screen.

### Main Success Scenario
1. The player opens the game start screen.
2. The system displays the available modes: single-player and multiplayer.
3. The player selects a mode.
4. The system confirms the selected mode.
5. The system starts the selected mode: starts a single-player game or transitions the player to the multiplayer room flow.
6. The player begins play in the selected mode.

### Extensions
* **3a**: The player selects single-player mode.  
  * **3a1**: The system starts a single-player game for the player.
* **3b**: The player selects multiplayer mode.  
  * **3b1**: The system transitions the player to join or create a multiplayer room.
* **5a**: The system cannot start the selected mode.  
  * **5a1**: The system displays an error message and returns the player to mode selection.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: Whether mode selection is available mid-session or only before starting a game is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player opens the game start screen. The system displays the available modes, including single-player and multiplayer. The player selects the mode they want.

The system confirms the selected mode and starts the appropriate flow. If the player chose single-player, the system starts a game immediately. If the player chose multiplayer, the system transitions the player into the room flow to play with others. The player begins play in the chosen mode.

### Alternative Scenario 3a — Select Single-Player Mode
A player selects single-player mode.

The system starts a single-player game for the player and transitions them into the first phase of gameplay.

### Alternative Scenario 3b — Select Multiplayer Mode
A player selects multiplayer mode.

The system transitions the player to the multiplayer flow where they can join or create a room.

### Alternative Scenario 5a — Cannot Start Selected Mode
A player selects a mode, but the system cannot start the selected mode due to a service or availability issue.

The system displays an error message and returns the player to the mode selection screen so they can retry.

---

## Acceptance Test Suite

### AT-UC-43-01 — Player Selects Mode and Enters Correct Flow
**Covers**: Main Success Scenario

- **Given** the player is on the game start screen  
- **When** the player selects a mode  
- **Then** the system starts the corresponding flow for that mode  
  **And** the player begins play in the selected mode

### AT-UC-43-02 — Select Single-Player Starts Game
**Covers**: Extension 3a

- **Given** the player is on the mode selection screen  
- **When** the player selects single-player mode  
- **Then** the system starts a single-player game

### AT-UC-43-03 — Select Multiplayer Enters Room Flow
**Covers**: Extension 3b

- **Given** the player is on the mode selection screen  
- **When** the player selects multiplayer mode  
- **Then** the system transitions the player to join or create a multiplayer room

### AT-UC-43-04 — Cannot Start Selected Mode
**Covers**: Extension 5a

- **Given** the player has selected a mode  
- **When** the system cannot start the selected mode  
- **Then** the system displays an error message  
  **And** returns the player to mode selection

### AT-UC-43-05 — No Incorrect Mode Entered
**Covers**: All failure paths

- **Given** the player selects a mode  
- **When** the selected mode cannot be started  
- **Then** the system does not enter the wrong mode

### AT-UC-43-06 — Mode Choice Enables Solo or Group Play
**Covers**: Success End Condition

- **Given** the player can choose between single-player and multiplayer  
- **When** the player selects a mode  
- **Then** the player can play alone in single-player or with others in multiplayer

---

*UC-43 status: COMPLETE*

# UC-44 — Play Single-Player Against the System

## Source User Story
**US-44**: As a single-player user, I want to play against the system so that I can practice without joining a room.

---

## Use Case (Cockburn Style)

**Goal in Context**: Let a player start and play a single-player match against the system without joining a multiplayer room.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Match Manager, Game Server, System Opponent Service  
**Trigger**: The player chooses to start a single-player game against the system.

### Success End Condition
* The player is able to play a single-player match against the system without joining a room.

### Failed End Condition
* The player cannot start or continue a single-player match against the system.

### Preconditions
* The player is on the single-player start flow.
* The system opponent feature is available.

### Main Success Scenario
1. The player selects single-player mode and chooses to play against the system.
2. The system creates a single-player match instance for the player.
3. The system initializes a system opponent for the match.
4. The system starts the match and transitions the player to the first match phase.
5. During each round, the system generates the system opponent’s actions for that round.
6. The player completes the round normally and the system scores the round.
7. The player continues playing the match against the system.

### Extensions
* **3a**: The system cannot initialize the system opponent.  
  * **3a1**: The system displays an error message and does not start the match against the system.
* **5a**: The system cannot generate the system opponent’s action for a round.  
  * **5a1**: The system ends the match and informs the player that the match cannot continue.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: The difficulty level and behavior of the system opponent are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player chooses single-player mode and selects the option to play against the system. The system creates a single-player match instance and initializes a system opponent.

The system starts the match and transitions the player into the first phase. For each round, the system generates the system opponent’s actions and the player completes the round normally. The system scores the round and the player continues practicing against the system without joining a room.

### Alternative Scenario 3a — System Opponent Cannot Be Initialized
A player chooses to play against the system. The system creates a single-player match instance but cannot initialize the system opponent.

The system displays an error message and does not start the match against the system. The player is prevented from entering a practice match until the system opponent feature is available.

### Alternative Scenario 5a — System Opponent Action Cannot Be Generated
A match against the system is in progress. When a round begins, the system cannot generate the system opponent’s action for that round.

The system ends the match and informs the player that the match cannot continue. The player does not remain in a broken round state.

---

## Acceptance Test Suite

### AT-UC-44-01 — Start Single-Player Match Against System
**Covers**: Main Success Scenario

- **Given** the player is on the single-player start flow  
- **When** the player chooses to play against the system  
- **Then** the system creates a single-player match instance  
  **And** initializes a system opponent  
  **And** starts the match without joining a room

### AT-UC-44-02 — Cannot Initialize System Opponent
**Covers**: Extension 3a

- **Given** the player chooses to play against the system  
- **When** the system cannot initialize the system opponent  
- **Then** the system does not start the match  
  **And** displays an error message

### AT-UC-44-03 — Cannot Generate System Opponent Action
**Covers**: Extension 5a

- **Given** a match against the system is in progress  
- **When** the system cannot generate the opponent’s action for a round  
- **Then** the system ends the match  
  **And** informs the player that the match cannot continue

### AT-UC-44-04 — No Broken Single-Player State
**Covers**: All failure paths

- **Given** the system cannot initialize the system opponent or cannot generate an opponent action  
- **Then** the system does not leave the player in an active round that cannot progress

### AT-UC-44-05 — Practice Without Joining a Room
**Covers**: Success End Condition

- **Given** the player starts a single-player match against the system  
- **When** the match begins  
- **Then** the player can practice against the system  
  **And** the player does not join a multiplayer room

---

*UC-44 status: COMPLETE*

# UC-45 — Create or Join Game Room

## Source User Story
**US-45**: As a multiplayer player, I want to create or join a game room so that I can compete with others.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a multiplayer player to create a new game room or join an existing game room so they can compete with others.  
**Scope**: Multiplayer Game System  
**Level**: User Goal  
**Primary Actor**: Multiplayer Player  
**Secondary Actors**: Room Service, Lobby Service, Network Service  
**Trigger**: The player selects the multiplayer option from the game menu.

### Success End Condition
* The player is placed in a valid game room lobby and can proceed to compete with other players.

### Failed End Condition
* The player is not placed into any game room and cannot proceed to compete.

### Preconditions
* The player is authenticated.
* Multiplayer services are available.

### Main Success Scenario
1. The player opens the multiplayer menu.
2. The system displays options to create a room or join an existing room.
3. The player selects **Create Room**.
4. The system prompts the player to configure room settings.
5. The player provides valid room settings and confirms.
6. The system creates the game room.
7. The system adds the player to the room as host.
8. The system displays the game room lobby.

### Extensions
* **3a**: The player chooses to join an existing room.  
  * **3a1**: The player selects **Join Room**.  
  * **3a2**: The system displays available rooms or a room-code entry option.  
  * **3a3**: The player selects a joinable room or enters a valid room code.  
  * **3a4**: The system adds the player to the room and displays the room lobby.
* **3b**: No joinable rooms are available.  
  * **3b1**: The system finds no rooms that can be joined.  
  * **3b2**: The system informs the player that no rooms are available and returns them to the multiplayer menu.
* **6a**: The system fails to create or join a room due to a system error.  
  * **6a1**: The system displays an error message indicating the room operation failed and advises the player to try again later.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: Whether joining is done via room list, room code, or both; and how room capacity rules are defined.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A multiplayer player opens the game and navigates to the multiplayer menu to compete with others. The system presents options to create or join a game room. The player chooses to create a room and is prompted to configure basic room settings.

After confirming valid settings, the system successfully creates the room and assigns the player as the host. The player is placed into the game room lobby, where they can wait for other players and prepare to start a match.

### Alternative Scenario 3a — Player Joins an Existing Room
The player opens the multiplayer menu and selects the option to join a room instead of creating one. The system displays available rooms or allows the player to enter a room code. The player selects a valid room, and the system adds them to the room lobby so they can compete with others.

### Alternative Scenario 3b — No Rooms Available
The player attempts to join a room, but the system finds no joinable rooms. The system informs the player that no rooms are currently available and returns them to the multiplayer menu. The player remains outside any game room.

### Alternative Scenario 6a — System Error During Room Operation
The player attempts to create or join a room, but a system error occurs while processing the request. The system displays an error message indicating the operation failed and advises the player to try again later. The player is not placed into a room.

---

## Acceptance Test Suite

### AT-UC-45-01 — Successful Room Creation
**Covers**: Main Success Scenario

- **Given** the player is authenticated  
- **When** the player creates a room with valid settings  
- **Then** the system creates the room  
  **And** places the player into the room lobby

### AT-UC-45-02 — Successful Room Join
**Covers**: Extension 3a

- **Given** a joinable game room exists  
- **When** the player selects and joins the room  
- **Then** the system places the player into the room lobby

### AT-UC-45-03 — No Rooms Available to Join
**Covers**: Extension 3b

- **Given** no joinable rooms exist  
- **When** the player attempts to join a room  
- **Then** the system informs the player no rooms are available  
  **And** the player is not placed into a room

### AT-UC-45-04 — System Error During Room Operation
**Covers**: Extension 6a

- **Given** a system error occurs  
- **When** the player attempts to create or join a room  
- **Then** the system displays an error message  
  **And** the player is not placed into a room

### AT-UC-45-05 — No Partial Room Membership
**Covers**: All failure paths

- **Given** a room operation fails  
- **Then** the player is not partially added to any room

### AT-UC-45-06 — Room Access Enables Competition
**Covers**: Success End Condition

- **Given** the player is placed in a room lobby  
- **When** the match flow proceeds  
- **Then** the player is eligible to compete with other players

---

*UC-45 status: COMPLETE*

# UC-46 — Identify Room Host

## Source User Story
**US-46**: As a room host, I want to be clearly identified so that players know who controls the room.

---

## Use Case (Cockburn Style)

**Goal in Context**: Clearly indicate which player is the room host so all players understand who controls room actions.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Room Host  
**Secondary Actors**: Room Service, Lobby UI  
**Trigger**: A room lobby is displayed, or the host changes.

### Success End Condition
* The room host is clearly identified to all players in the room lobby.

### Failed End Condition
* Players in the room cannot determine who the host is.

### Preconditions
* A multiplayer room exists.
* A host is assigned for the room.

### Main Success Scenario
1. The system assigns a host to a multiplayer room.
2. The system displays the room lobby to players.
3. The system marks the host in the lobby view so the host is clearly identified.
4. Players view the lobby and can determine who the host is.

### Extensions
* **1a**: The current host leaves the room.  
  * **1a1**: The system assigns a new host from the remaining players.  
  * **1a2**: The system updates the lobby to identify the new host.
* **3a**: The host indicator cannot be displayed.  
  * **3a1**: The system displays a message indicating host information is unavailable.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The exact host indicator style (badge, icon, label) is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A multiplayer room is created and the system assigns a host. The system displays the room lobby to all players in the room.

The system marks the host in the lobby view so the host is clearly identified. Players can see who controls the room and understand who can start the match or manage room settings.

### Alternative Scenario 1a — Host Leaves Room
The current host leaves the room while other players remain.

The system assigns a new host from the remaining players and updates the lobby to identify the new host. Players can still determine who controls the room.

### Alternative Scenario 3a — Host Indicator Cannot Be Displayed
A lobby is displayed but the system cannot display the host indicator.

The system displays a message indicating host information is unavailable. Players are informed that the host cannot currently be identified.

---

## Acceptance Test Suite

### AT-UC-46-01 — Host Clearly Identified in Lobby
**Covers**: Main Success Scenario

- **Given** a multiplayer room exists with an assigned host  
- **When** the lobby is displayed  
- **Then** the host is marked in the lobby so players can identify the host

### AT-UC-46-02 — Host Reassigned When Host Leaves
**Covers**: Extension 1a

- **Given** a room has an assigned host  
- **When** the host leaves the room  
- **Then** the system assigns a new host from remaining players  
  **And** updates the lobby host indicator

### AT-UC-46-03 — Host Indicator Cannot Be Displayed
**Covers**: Extension 3a

- **Given** a room lobby is displayed  
- **When** the host indicator cannot be shown  
- **Then** the system displays a host-unavailable message  
  **And** does not display incorrect host information

### AT-UC-46-04 — No Incorrect Host Displayed
**Covers**: All failure paths

- **Given** host identification cannot be displayed  
- **Then** the system does not display an incorrect host identity

### AT-UC-46-05 — Players Know Who Controls the Room
**Covers**: Success End Condition

- **Given** the host is marked in the lobby  
- **When** players view the room lobby  
- **Then** players can determine who the room host is

---

*UC-46 status: COMPLETE*

# UC-47 — Delete Room as Host

## Source User Story
**US-47**: As a room host, I want exclusive permission to delete the room so that room management is controlled.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow only the room host to delete the room to maintain controlled room management.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Room Host  
**Secondary Actors**: Room Service, Game Server, Lobby UI  
**Trigger**: A user attempts to delete a room.

### Success End Condition
* The room is deleted when requested by the host, and all players are removed from the room.

### Failed End Condition
* A non-host deletes the room, or the host cannot delete the room when requested.

### Preconditions
* A multiplayer room exists.
* A host is assigned for the room.
* The room is not in an active match.

### Main Success Scenario
1. The host is in the room lobby.
2. The host selects the option to delete the room.
3. The system verifies that the requesting user is the room host.
4. The system deletes the room.
5. The system informs all players that the room was deleted and returns them to the appropriate screen.

### Extensions
* **2a**: The room is in an active match.  
  * **2a1**: The system does not delete the room and informs the host that deletion is not available during an active match.
* **3a**: A non-host attempts to delete the room.  
  * **3a1**: The system rejects the request and informs the non-host they do not have permission.
* **4a**: The room cannot be deleted due to a system error.  
  * **4a1**: The system displays an error message and keeps the room unchanged.

### Related Information
* **Priority**: High  
* **Frequency**: Medium  
* **Open Issues**: Whether the host must confirm deletion is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A room host is in the lobby and chooses the option to delete the room. The system verifies that the user making the request is the assigned host.

The system deletes the room and informs all players that the room was deleted. All players are removed from the room and returned to the appropriate screen.

### Alternative Scenario 2a — Room Is in an Active Match
The host attempts to delete the room while a match is active.

The system does not delete the room and informs the host that deletion is not available during an active match. The room remains active.

### Alternative Scenario 3a — Non-Host Attempts Deletion
A non-host user attempts to delete the room.

The system rejects the deletion request and informs the user that they do not have permission to delete the room. The room remains unchanged.

### Alternative Scenario 4a — Room Cannot Be Deleted
The host attempts to delete the room, but the system cannot delete it due to an error.

The system displays an error message and keeps the room unchanged. Players remain in the room.

---

## Acceptance Test Suite

### AT-UC-47-01 — Host Deletes Room Successfully
**Covers**: Main Success Scenario

- **Given** a multiplayer room exists with an assigned host  
  **And** no match is active  
- **When** the host selects delete room  
- **Then** the system deletes the room  
  **And** informs all players and removes them from the room

### AT-UC-47-02 — Cannot Delete Room During Active Match
**Covers**: Extension 2a

- **Given** a match is active in the room  
- **When** the host attempts to delete the room  
- **Then** the system does not delete the room  
  **And** informs the host that deletion is not available during an active match

### AT-UC-47-03 — Non-Host Cannot Delete Room
**Covers**: Extension 3a

- **Given** a multiplayer room exists with an assigned host  
- **When** a non-host attempts to delete the room  
- **Then** the system rejects the request  
  **And** informs the user they do not have permission

### AT-UC-47-04 — Room Deletion Error
**Covers**: Extension 4a

- **Given** a host attempts to delete the room  
- **When** the system encounters an error deleting the room  
- **Then** the system displays an error message  
  **And** the room remains unchanged

### AT-UC-47-05 — No Unauthorized Room Deletion
**Covers**: All failure paths

- **Given** a room deletion request is made  
- **Then** the room is deleted only if the requester is the host and the room is not in an active match

### AT-UC-47-06 — Controlled Room Management Enforced
**Covers**: Success End Condition

- **Given** the host deletes the room successfully  
- **When** players are notified  
- **Then** all players are removed from the room  
  **And** the deleted room is no longer joinable

---

*UC-47 status: COMPLETE*

# UC-48 — Prevent Non-Host From Deleting Room

## Source User Story
**US-48**: As a non-host player, I want to be prevented from deleting the room so that accidental shutdowns cannot occur.

---

## Use Case (Cockburn Style)

**Goal in Context**: Prevent accidental or unauthorized room deletion by ensuring only the host can delete a room.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Non-Host Player  
**Secondary Actors**: Room Service, Game Server, Lobby UI  
**Trigger**: A non-host player attempts to delete a room.

### Success End Condition
* A non-host player is prevented from deleting the room and the room remains active.

### Failed End Condition
* A non-host player deletes the room or the system fails to prevent the deletion attempt.

### Preconditions
* A multiplayer room exists.
* A host is assigned for the room.
* The requesting player is not the host.

### Main Success Scenario
1. A non-host player is in the room lobby.
2. The non-host player attempts to delete the room.
3. The system verifies that the requesting player is not the room host.
4. The system rejects the deletion request.
5. The system informs the player that they do not have permission to delete the room.
6. The room remains active and unchanged.

### Extensions
* **2a**: The room is in an active match.  
  * **2a1**: The system rejects the deletion request and informs the player that they do not have permission.
* **3a**: The system cannot verify the player’s role.  
  * **3a1**: The system rejects the deletion request and informs the player that the action cannot be performed.
* **4a**: The system encounters an error while processing the request.  
  * **4a1**: The system rejects the deletion request and keeps the room unchanged.

### Related Information
* **Priority**: High  
* **Frequency**: Medium  
* **Open Issues**: Whether the delete option is hidden or disabled for non-host players is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A non-host player is in the room lobby and attempts to delete the room. The system verifies that the player is not the assigned host.

The system rejects the deletion request and informs the player that they do not have permission to delete the room. The room remains active and gameplay is not disrupted.

### Alternative Scenario 2a — Active Match
A non-host player attempts to delete the room while a match is active.

The system rejects the request and informs the player that they do not have permission. The room and match remain unaffected.

### Alternative Scenario 3a — Cannot Verify Player Role
A non-host player attempts to delete the room, but the system cannot verify the player’s role.

The system rejects the deletion request and informs the player that the action cannot be performed. The room remains unchanged.

### Alternative Scenario 4a — System Error During Request
A non-host player attempts to delete the room, but the system encounters an error while processing the request.

The system rejects the deletion request and keeps the room unchanged. The player is informed that the action failed.

---

## Acceptance Test Suite

### AT-UC-48-01 — Non-Host Cannot Delete Room
**Covers**: Main Success Scenario

- **Given** a multiplayer room exists with an assigned host  
  **And** the player is not the host  
- **When** the player attempts to delete the room  
- **Then** the system rejects the request  
  **And** informs the player they do not have permission  
  **And** the room remains active

### AT-UC-48-02 — Non-Host Cannot Delete During Active Match
**Covers**: Extension 2a

- **Given** a match is active in the room  
  **And** the player is not the host  
- **When** the player attempts to delete the room  
- **Then** the system rejects the request  
  **And** the room remains unchanged

### AT-UC-48-03 — Cannot Verify Player Role
**Covers**: Extension 3a

- **Given** a non-host player attempts to delete the room  
- **When** the system cannot verify the player’s role  
- **Then** the system rejects the deletion request  
  **And** informs the player the action cannot be performed

### AT-UC-48-04 — System Error Does Not Delete Room
**Covers**: Extension 4a

- **Given** a non-host player attempts to delete the room  
- **When** a system error occurs  
- **Then** the system does not delete the room  
  **And** the room remains unchanged

### AT-UC-48-05 — No Unauthorized Room Deletion
**Covers**: All failure paths

- **Given** a room deletion request is made by a non-host  
- **Then** the room is never deleted as a result of the request

### AT-UC-48-06 — Accidental Shutdowns Prevented
**Covers**: Success End Condition

- **Given** only the host has permission to delete the room  
- **When** non-host players interact with room controls  
- **Then** accidental room shutdowns do not occur

---

*UC-48 status: COMPLETE*

# UC-49 — Automatically Close Room When Host Leaves or Deletes It

## Source User Story
**US-49**: As a player, I want the game to automatically close the room when the host leaves or deletes it so that the system remains consistent.

---

## Use Case (Cockburn Style)

**Goal in Context**: Keep the system consistent by automatically closing a room when the host leaves the room or deletes it.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Room Service, Match Manager, Game Server  
**Trigger**: The host leaves the room or deletes the room.

### Success End Condition
* The room is closed automatically when the host leaves or deletes it, and remaining players are removed from the room.

### Failed End Condition
* The host leaves or deletes the room but the room remains open or players remain in an inconsistent room state.

### Preconditions
* A multiplayer room exists.
* A host is assigned for the room.

### Main Success Scenario
1. A host is in a multiplayer room.
2. The host leaves the room.
3. The system detects that the host has left.
4. The system closes the room automatically.
5. The system informs remaining players that the room has been closed and removes them from the room.
6. The players return to the appropriate screen.

### Extensions
* **2a**: The host deletes the room instead of leaving.  
  * **2a1**: The system deletes the room and closes it, removing all players.
* **4a**: A match is active when the host leaves or deletes the room.  
  * **4a1**: The system ends the match and closes the room, informing all players.
* **4b**: The system cannot close the room automatically.  
  * **4b1**: The system informs players that the room could not be closed and prevents further room actions.

### Related Information
* **Priority**: High  
* **Frequency**: Medium  
* **Open Issues**: Whether host reassignment is ever allowed instead of closing the room is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A host is in a multiplayer room and leaves the room. The system detects that the host has left.

The system closes the room automatically to keep the system consistent. The system informs the remaining players that the room has been closed, removes them from the room, and returns them to the appropriate screen.

### Alternative Scenario 2a — Host Deletes the Room
A host chooses to delete the room while in the room.

The system deletes and closes the room, removing all players. Remaining players are informed that the room has been closed and are returned to the appropriate screen.

### Alternative Scenario 4a — Active Match When Host Leaves or Deletes
The host leaves or deletes the room while a match is active.

The system ends the match and closes the room, informing all players. Players are removed from the room and returned to the appropriate screen.

### Alternative Scenario 4b — Cannot Close Room Automatically
The host leaves or deletes the room, but the system cannot close the room automatically.

The system informs players that the room could not be closed and prevents further room actions to avoid inconsistent state. Players are not left in an active room that can be used incorrectly.

---

## Acceptance Test Suite

### AT-UC-49-01 — Close Room When Host Leaves
**Covers**: Main Success Scenario

- **Given** a multiplayer room exists with an assigned host  
- **When** the host leaves the room  
- **Then** the system closes the room automatically  
  **And** removes remaining players from the room  
  **And** informs them that the room was closed

### AT-UC-49-02 — Close Room When Host Deletes It
**Covers**: Extension 2a

- **Given** a multiplayer room exists with an assigned host  
- **When** the host deletes the room  
- **Then** the system closes the room  
  **And** removes all players from the room  
  **And** informs them that the room was closed

### AT-UC-49-03 — Close Room Ends Active Match
**Covers**: Extension 4a

- **Given** a match is active in the room  
- **When** the host leaves or deletes the room  
- **Then** the system ends the match  
  **And** closes the room  
  **And** removes all players

### AT-UC-49-04 — Cannot Close Room Prevents Inconsistent Actions
**Covers**: Extension 4b

- **Given** the host leaves or deletes the room  
- **When** the system cannot close the room automatically  
- **Then** the system informs players of the failure  
  **And** prevents further room actions

### AT-UC-49-05 — No Inconsistent Room State
**Covers**: All failure paths

- **Given** the host has left or deleted the room  
- **Then** remaining players are not left in a room state where gameplay can continue inconsistently

### AT-UC-49-06 — Room Consistency Preserved
**Covers**: Success End Condition

- **Given** the host leaves or deletes the room  
- **When** the system closes the room  
- **Then** all players are removed and the room is no longer joinable  
  **And** the system remains consistent

---

*UC-49 status: COMPLETE*

# UC-50 — Store Scoring History Per Room

## Source User Story
**US-50**: As a player, I want my scoring history to be stored per room so that results are separated between matches.

---

## Use Case (Cockburn Style)

**Goal in Context**: Store and retrieve a player’s scoring history on a per-room basis so results from different matches remain separated.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Scoring Service, Room Manager, Persistence Service  
**Trigger**: A round or match within a room produces scoring results.

### Success End Condition
* The system stores scoring history associated with the correct room and makes it available without mixing results from other rooms.

### Failed End Condition
* The system fails to store scoring history per room or mixes results across rooms.

### Preconditions
* The player is participating in an active room.
* The system produces scoring results for a round or match in that room.

### Main Success Scenario
1. A round or match within a room produces scoring results for the player.
2. The system identifies the room associated with the results.
3. The system stores the player’s scoring results linked to that room.
4. The system maintains the stored history separately from other rooms.
5. The system makes the room-specific scoring history available for later viewing.

### Extensions
* **2a**: The system cannot identify the room for the scoring results.  
  * **2a1**: The system displays an error message and does not store the scoring results.
* **3a**: The system encounters an error while storing scoring history.  
  * **3a1**: The system displays an error message and does not store the results.
* **5a**: The system cannot retrieve room-specific scoring history.  
  * **5a1**: The system displays an error message and does not display scoring history.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: The retention duration and maximum history size per room are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player completes a round or match within a specific room. The system produces scoring results and identifies the room where the results were generated.

The system stores the player’s scoring history linked to that room and keeps it separate from scoring histories of other rooms. When requested later, the system can present the scoring history specific to that room only.

### Alternative Scenario 2a — Room Cannot Be Identified
The system produces scoring results but cannot determine which room the results belong to.

The system displays an error message and does not store the scoring results. The player’s scoring history is not updated.

### Alternative Scenario 3a — Scoring History Storage Failure
The system identifies the room and attempts to store the scoring history. An error occurs during storage.

The system displays an error message and does not store the scoring results. The scoring history remains unchanged.

### Alternative Scenario 5a — Room-Specific History Cannot Be Retrieved
The player requests to view scoring history for a room. The system cannot retrieve the room-specific history due to a retrieval error.

The system displays an error message and does not display the scoring history.

---

## Acceptance Test Suite

### AT-UC-50-01 — Store Scoring History Per Room
**Covers**: Main Success Scenario

- **Given** scoring results are produced within a room  
- **When** the system stores the results  
- **Then** the results are stored linked to that room  
  **And** kept separate from results of other rooms

### AT-UC-50-02 — Room Cannot Be Identified
**Covers**: Extension 2a

- **Given** scoring results are produced  
- **When** the system cannot identify the associated room  
- **Then** the system displays an error message  
  **And** does not store the scoring results

### AT-UC-50-03 — Scoring History Storage Failure
**Covers**: Extension 3a

- **Given** the system identifies the room  
- **When** an error occurs while storing scoring history  
- **Then** the system displays an error message  
  **And** does not store the results

### AT-UC-50-04 — Room-Specific History Cannot Be Retrieved
**Covers**: Extension 5a

- **Given** scoring history exists for a room  
- **When** the system cannot retrieve the room-specific history  
- **Then** the system displays an error message  
  **And** does not display scoring history

### AT-UC-50-05 — No Cross-Room History Mixing
**Covers**: All failure paths

- **Given** scoring history storage or retrieval fails  
- **Then** no scoring history from another room is displayed or mixed

### AT-UC-50-06 — Room-Scoped History Available
**Covers**: Success End Condition

- **Given** scoring history is stored for a room  
- **When** the player views scoring history for that room  
- **Then** only results from that room are shown

---

*UC-50 status: COMPLETE*

# UC-51 — Link Scores to User Identity

## Source User Story
**US-51**: As a player, I want my scores to be linked to my user identity (OAuth) so that performance tracking is accurate.

---

## Use Case (Cockburn Style)

**Goal in Context**: Link a player’s scores to their authenticated user identity so performance tracking is accurate for signed-in players.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: OAuth Provider, Identity Service, Scoring Service, Persistence Service  
**Trigger**: The system records a score for a signed-in player.

### Success End Condition
* The player’s scores are recorded and stored under the player’s authenticated user identity.

### Failed End Condition
* The player’s scores are not linked to the authenticated identity or are linked incorrectly.

### Preconditions
* The player is signed in through OAuth.
* The system produces a score for the player in an active match.

### Main Success Scenario
1. The player is signed in through OAuth.
2. The system produces a score for the player during a match.
3. The system retrieves the player’s authenticated user identity.
4. The system records the score linked to the authenticated identity.
5. The system stores the identity-linked score for later performance tracking.

### Extensions
* **1a**: The player is not signed in through OAuth.  
  * **1a1**: The system does not link the score to an OAuth identity.
* **3a**: The system cannot retrieve the authenticated user identity.  
  * **3a1**: The system displays an error message and does not store the score as identity-linked.
* **4a**: The system encounters an error while recording the identity-linked score.  
  * **4a1**: The system displays an error message and does not store the score.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: Whether guest scores can later be merged into an OAuth identity is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player signs into the Blend Colour game using OAuth and participates in a match. When the system produces a score for the player, it retrieves the authenticated user identity associated with the OAuth sign-in.

The system records the score linked to that identity and stores it for later performance tracking. This ensures the player’s performance history remains accurate and tied to the correct signed-in user.

### Alternative Scenario 1a — Player Not Signed In
A player participates in a match without signing in through OAuth. When the system produces a score for the player, there is no authenticated identity available.

The system does not link the score to an OAuth identity. The score is not stored as identity-linked for OAuth performance tracking.

### Alternative Scenario 3a — Authenticated Identity Cannot Be Retrieved
A player is signed in through OAuth and earns a score. The system attempts to retrieve the authenticated user identity but cannot due to an identity service error.

The system displays an error message and does not store the score as identity-linked. The score is not recorded for accurate identity-based tracking.

### Alternative Scenario 4a — Error Recording Identity-Linked Score
The system retrieves the authenticated user identity and attempts to record the score linked to it. An error occurs while recording or storing the identity-linked score.

The system displays an error message and does not store the score. The player’s performance tracking is not updated.

---

## Acceptance Test Suite

### AT-UC-51-01 — Score Linked to OAuth Identity
**Covers**: Main Success Scenario

- **Given** the player is signed in through OAuth  
- **When** the system produces a score for the player  
- **Then** the system retrieves the authenticated user identity  
  **And** records and stores the score linked to that identity

### AT-UC-51-02 — Player Not Signed In
**Covers**: Extension 1a

- **Given** the player is not signed in through OAuth  
- **When** the system produces a score for the player  
- **Then** the system does not link the score to an OAuth identity

### AT-UC-51-03 — Authenticated Identity Cannot Be Retrieved
**Covers**: Extension 3a

- **Given** the player is signed in through OAuth  
- **When** the system cannot retrieve the authenticated user identity  
- **Then** the system displays an error message  
  **And** does not store the score as identity-linked

### AT-UC-51-04 — Error Recording Identity-Linked Score
**Covers**: Extension 4a

- **Given** the system retrieves the authenticated user identity  
- **When** an error occurs while recording the identity-linked score  
- **Then** the system displays an error message  
  **And** does not store the score

### AT-UC-51-05 — No Incorrect Identity Linking
**Covers**: All failure paths

- **Given** identity retrieval or score recording fails  
- **Then** no score is stored under an incorrect OAuth identity

### AT-UC-51-06 — Identity-Linked Scores Support Accurate Tracking
**Covers**: Success End Condition

- **Given** scores are stored linked to the authenticated identity  
- **When** performance tracking is viewed for the user  
- **Then** the tracked performance reflects the user’s scores accurately

---

*UC-51 status: COMPLETE*

# UC-52 — View Score History in Current Room

## Source User Story
**US-52**: As a player, I want to view my score history within the current room so that I can track round-by-round progress.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to view their score history for the current room so progress can be tracked round-by-round.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Room Manager, Scoring Service, Persistence Service, Game UI System  
**Trigger**: The player requests to view score history while in a room.

### Success End Condition
* The player can view their score history for the current room, showing round-by-round progress.

### Failed End Condition
* The player cannot view score history for the current room.

### Preconditions
* The player is in a room.
* Score history exists for the player in the current room.

### Main Success Scenario
1. The player opens the room interface.
2. The player selects an option to view score history.
3. The system identifies the current room.
4. The system retrieves the player’s score history for the current room.
5. The system displays the score history to the player.
6. The player reviews the score history to track round-by-round progress.

### Extensions
* **3a**: The system cannot identify the current room.  
  * **3a1**: The system displays an error message and does not display score history.
* **4a**: The system cannot retrieve the player’s score history for the current room.  
  * **4a1**: The system displays an error message and does not display score history.
* **5a**: The system fails to display the score history.  
  * **5a1**: The system displays an error message and prompts the player to retry viewing score history.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: The presentation format and how history is summarized across rounds is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player is in a room during a Blend Colour match and wants to track progress across rounds. The player selects an option to view score history from the room interface.

The system identifies the current room and retrieves the player’s score history for that room. The system displays the history to the player, allowing the player to review round-by-round progress.

### Alternative Scenario 3a — Current Room Cannot Be Identified
The player requests to view score history. The system attempts to identify the current room but cannot due to a room management error.

The system displays an error message and does not display score history. The player cannot view round-by-round progress.

### Alternative Scenario 4a — Score History Cannot Be Retrieved
The system identifies the current room and attempts to retrieve the player’s score history for that room. The system cannot retrieve the history due to a retrieval or storage error.

The system displays an error message and does not display score history. The player cannot view their progress.

### Alternative Scenario 5a — Score History Not Displayed
The system retrieves the player’s score history but fails to display it due to a UI error.

The system displays an error message and prompts the player to retry viewing score history. The player does not see history until display succeeds.

---

## Acceptance Test Suite

### AT-UC-52-01 — Score History Displayed for Current Room
**Covers**: Main Success Scenario

- **Given** the player is in a room and score history exists for that room  
- **When** the player requests to view score history  
- **Then** the system retrieves the player’s score history for the current room  
  **And** displays it to the player

### AT-UC-52-02 — Current Room Cannot Be Identified
**Covers**: Extension 3a

- **Given** the player requests to view score history  
- **When** the system cannot identify the current room  
- **Then** the system displays an error message  
  **And** does not display score history

### AT-UC-52-03 — Score History Cannot Be Retrieved
**Covers**: Extension 4a

- **Given** the current room is identified  
- **When** the system cannot retrieve the player’s score history for the room  
- **Then** the system displays an error message  
  **And** does not display score history

### AT-UC-52-04 — Score History Not Displayed
**Covers**: Extension 5a

- **Given** score history is retrieved for the current room  
- **When** the system fails to display the score history  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing score history

### AT-UC-52-05 — No Cross-Room History Display
**Covers**: All failure paths

- **Given** room identification, retrieval, or display fails  
- **Then** no score history from another room is displayed

### AT-UC-52-06 — History Supports Round-by-Round Tracking
**Covers**: Success End Condition

- **Given** the system displays score history for the current room  
- **When** the player reviews the history  
- **Then** the player can track round-by-round progress within the room

---

*UC-52 status: COMPLETE*

# UC-53 — Persist Room Scoring History After Leaving

## Source User Story
**US-53**: As a signed-in player, I want my room scoring history to persist after leaving so that I can review past matches.

---

## Use Case (Cockburn Style)

**Goal in Context**: Persist a signed-in player’s room scoring history after they leave a room so past match results can be reviewed later.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Identity Service, Scoring Service, Room Manager, Persistence Service  
**Trigger**: A signed-in player leaves a room after scoring history has been generated.

### Success End Condition
* The signed-in player’s room scoring history remains stored after leaving and can be reviewed later.

### Failed End Condition
* The signed-in player’s room scoring history is lost or unavailable after leaving.

### Preconditions
* The player is signed in through OAuth.
* The player has participated in a room where scoring history exists.

### Main Success Scenario
1. The player participates in a room and scoring history is generated.
2. The player leaves the room.
3. The system identifies the player’s authenticated user identity.
4. The system stores the player’s room scoring history linked to the player identity and the room.
5. Later, the player requests to review past room scoring history.
6. The system retrieves and displays the stored room scoring history for the player.

### Extensions
* **2a**: The player is not signed in through OAuth.  
  * **2a1**: The system does not persist room scoring history for later review.
* **3a**: The system cannot identify the player’s authenticated user identity.  
  * **3a1**: The system displays an error message and does not store the scoring history for later review.
* **4a**: The system encounters an error while storing the room scoring history.  
  * **4a1**: The system displays an error message and does not persist the scoring history.
* **6a**: The system cannot retrieve the stored room scoring history.  
  * **6a1**: The system displays an error message and does not display past scoring history.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: The retention duration for stored scoring history is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A signed-in player participates in a room and accumulates scoring history across rounds or matches. When the player leaves the room, the system identifies the player’s authenticated identity and stores the room scoring history linked to both the player identity and the room.

Later, the player requests to review past room scoring history. The system retrieves the stored history and displays it, allowing the player to review past match performance even after leaving the room.

### Alternative Scenario 2a — Player Not Signed In
A player participates in a room but is not signed in through OAuth. After leaving the room, there is no authenticated identity to link room scoring history for later review.

The system does not persist room scoring history for later review. The player cannot review past room scoring history after leaving.

### Alternative Scenario 3a — Authenticated Identity Cannot Be Determined
A signed-in player leaves a room. The system attempts to identify the player’s authenticated user identity but cannot due to an identity service error.

The system displays an error message and does not store the scoring history for later review. The history is not persisted.

### Alternative Scenario 4a — Storage Error Persisting History
The system identifies the player’s authenticated identity and attempts to store the room scoring history. An error occurs during storage.

The system displays an error message and does not persist the scoring history. The player cannot review the history later.

### Alternative Scenario 6a — Stored History Cannot Be Retrieved
Later, the signed-in player requests to review past room scoring history. The system cannot retrieve the stored history due to a retrieval or storage error.

The system displays an error message and does not display past scoring history.

---

## Acceptance Test Suite

### AT-UC-53-01 — Signed-In Player History Persists After Leaving
**Covers**: Main Success Scenario

- **Given** a signed-in player has scoring history in a room  
- **When** the player leaves the room and later requests past room scoring history  
- **Then** the system stores the room scoring history linked to the player identity and the room  
  **And** retrieves and displays the stored history later

### AT-UC-53-02 — Player Not Signed In
**Covers**: Extension 2a

- **Given** the player is not signed in through OAuth  
- **When** the player leaves a room  
- **Then** the system does not persist room scoring history for later review

### AT-UC-53-03 — Authenticated Identity Cannot Be Determined
**Covers**: Extension 3a

- **Given** the player is signed in through OAuth  
- **When** the system cannot identify the authenticated user identity after leaving  
- **Then** the system displays an error message  
  **And** does not store the scoring history for later review

### AT-UC-53-04 — Storage Error Persisting History
**Covers**: Extension 4a

- **Given** the system identifies the player identity and room  
- **When** the system encounters an error storing the room scoring history  
- **Then** the system displays an error message  
  **And** does not persist the scoring history

### AT-UC-53-05 — Stored History Cannot Be Retrieved
**Covers**: Extension 6a

- **Given** room scoring history was previously stored for a signed-in player  
- **When** the system cannot retrieve the stored history  
- **Then** the system displays an error message  
  **And** does not display past scoring history

### AT-UC-53-06 — No Incorrect Persistence or Retrieval
**Covers**: All failure paths

- **Given** identity, storage, or retrieval fails  
- **Then** no room scoring history is persisted or shown under an incorrect user identity

### AT-UC-53-07 — Past Matches Can Be Reviewed
**Covers**: Success End Condition

- **Given** room scoring history is stored for a signed-in player after leaving  
- **When** the player requests to review past matches  
- **Then** the player can access the stored room scoring history

---

*UC-53 status: COMPLETE*

# UC-54 — Guest Scoring History Exists Only During Room

## Source User Story
**US-54**: As a guest player, I want my scoring history to exist only for the duration of the room so that temporary sessions remain lightweight.

---

## Use Case (Cockburn Style)

**Goal in Context**: Keep guest scoring history only for the duration of the room session so guest sessions remain lightweight and do not persist beyond the room.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Room Manager, Scoring Service, Session Manager  
**Trigger**: A guest player participates in scoring within a room.

### Success End Condition
* Guest scoring history is available while the guest remains in the room and is not available after the guest leaves or the room ends.

### Failed End Condition
* Guest scoring history persists after the room ends or is unavailable during the room.

### Preconditions
* The player is participating as a guest in a room.
* Scoring results are generated for the guest during the room.

### Main Success Scenario
1. A guest player joins a room.
2. The system records scoring results for the guest during the room.
3. The system maintains the guest’s scoring history for the current room session.
4. The guest views scoring history while in the room.
5. The guest leaves the room or the room ends.
6. The system removes the guest’s scoring history for that room.

### Extensions
* **1a**: The player is not a guest.  
  * **1a1**: The system does not apply guest-only scoring history rules.
* **3a**: The system cannot maintain session-only guest scoring history.  
  * **3a1**: The system displays an error message and does not provide guest scoring history.
* **6a**: The system encounters an error removing guest scoring history after leaving.  
  * **6a1**: The system displays an error message and does not remove guest scoring history.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: Whether guest history is removed immediately on leave or after room ends is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A guest player joins a room and plays rounds that produce scoring results. The system maintains scoring history for the guest within the current room session so the guest can track progress while playing.

When the guest leaves the room or the room ends, the system removes the guest’s scoring history for that room. This ensures guest sessions remain lightweight and do not persist data beyond the room.

### Alternative Scenario 1a — Player Not a Guest
A signed-in player participates in a room and produces scoring history. The system recognizes the player is not a guest.

The system does not apply guest-only scoring history rules. The player’s scoring history is handled under the signed-in user flow.

### Alternative Scenario 3a — Cannot Maintain Session-Only Guest History
A guest player participates in a room and scoring results are generated. The system cannot maintain session-only scoring history due to an internal error.

The system displays an error message and does not provide guest scoring history during the room.

### Alternative Scenario 6a — Error Removing Guest History
A guest leaves the room or the room ends. The system attempts to remove the guest’s scoring history but encounters an error.

The system displays an error message and does not remove the guest scoring history as expected.

---

## Acceptance Test Suite

### AT-UC-54-01 — Guest History Available During Room and Removed After
**Covers**: Main Success Scenario

- **Given** a player is a guest in a room and scoring results are generated  
- **When** the guest views score history during the room  
- **Then** the system displays guest scoring history for the room  
  **And** when the guest leaves or the room ends the system removes the guest scoring history

### AT-UC-54-02 — Player Not a Guest
**Covers**: Extension 1a

- **Given** the player is not a guest  
- **When** scoring results are generated  
- **Then** the system does not apply guest-only scoring history rules

### AT-UC-54-03 — Cannot Maintain Session-Only Guest History
**Covers**: Extension 3a

- **Given** a guest participates in a room  
- **When** the system cannot maintain session-only guest scoring history  
- **Then** the system displays an error message  
  **And** does not provide guest scoring history

### AT-UC-54-04 — Error Removing Guest History
**Covers**: Extension 6a

- **Given** guest scoring history exists for a room  
- **When** the guest leaves the room or the room ends and removal fails  
- **Then** the system displays an error message  
  **And** does not remove guest scoring history

### AT-UC-54-05 — No Guest History Persists as Valid Past History
**Covers**: All failure paths

- **Given** guest history maintenance or removal fails  
- **Then** guest scoring history is not presented as valid history for later review after the room

### AT-UC-54-06 — Guest Session Remains Lightweight
**Covers**: Success End Condition

- **Given** a guest leaves the room or the room ends  
- **When** the guest requests scoring history afterward  
- **Then** the system does not provide guest scoring history for that room

---

*UC-54 status: COMPLETE*

# UC-55 — View Submission Status of Players

## Source User Story
**US-55**: As a player, I want to see which players have already submitted their color so that I know who is finished.

---

## Use Case (Cockburn Style)

**Goal in Context**: Show a player which players have submitted their color in the current round so the player knows who is finished.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Submission Service, Game UI System  
**Trigger**: The player views the round interface during an active round.

### Success End Condition
* The player can view an up-to-date list of which players have submitted their color in the current round.

### Failed End Condition
* The player cannot view submission status and does not know who has finished.

### Preconditions
* The player is participating in an active match.
* A round is active and players can submit colors.

### Main Success Scenario
1. The round is active and players are blending colors.
2. A player submits a final blended color.
3. The system updates the round submission status for that player.
4. The system displays the submission status of all players to each player in the round.
5. The player views which players have already submitted.

### Extensions
* **2a**: The system does not receive a submission from a player.  
  * **2a1**: The system continues to display that the player has not submitted.
* **3a**: The system cannot update submission status due to an error.  
  * **3a1**: The system displays an error message and does not update the submission status display.
* **4a**: The system fails to display submission status to the player.  
  * **4a1**: The system displays an error message and prompts the player to retry viewing submission status.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: Whether the display includes ordering or timestamps is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
During an active round, players blend colors and submit their final blended colors when ready. When a player submits, the system updates the submission status for that player.

The system displays an updated view of submission status to all players in the round. A player can see which players have already submitted and which players have not, helping them understand who is finished.

### Alternative Scenario 2a — No Submission Received From a Player
The round is active and the system is tracking submissions. A specific player has not submitted a color.

The system continues to display that the player has not submitted. Other players can still view which players are finished and which are not.

### Alternative Scenario 3a — Submission Status Update Error
A player submits a final blended color. The system attempts to update submission status but encounters an error.

The system displays an error message and does not update the submission status display. Players cannot rely on the submission status view.

### Alternative Scenario 4a — Submission Status Not Displayed
The system updates submission status and attempts to display it to a player. A display error occurs and the player cannot see the submission status.

The system displays an error message and prompts the player to retry viewing submission status. The player does not see who has submitted until display succeeds.

---

## Acceptance Test Suite

### AT-UC-55-01 — Submission Status Displayed to Players
**Covers**: Main Success Scenario

- **Given** a round is active and players can submit colors  
- **When** a player submits a final blended color  
- **Then** the system updates submission status for that player  
  **And** displays the submission status of all players to each player

### AT-UC-55-02 — No Submission Received From a Player
**Covers**: Extension 2a

- **Given** a round is active  
- **When** a player has not submitted a color  
- **Then** the system continues to display that the player has not submitted

### AT-UC-55-03 — Submission Status Update Error
**Covers**: Extension 3a

- **Given** a player submits a final blended color  
- **When** the system cannot update submission status due to an error  
- **Then** the system displays an error message  
  **And** does not update the submission status display

### AT-UC-55-04 — Submission Status Not Displayed
**Covers**: Extension 4a

- **Given** submission status exists to display  
- **When** the system fails to display submission status to the player  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing submission status

### AT-UC-55-05 — No Misleading Submission Status
**Covers**: All failure paths

- **Given** status update or display fails  
- **Then** the system does not show a misleading submission status as accurate

### AT-UC-55-06 — Submission Status Supports Knowing Who Is Finished
**Covers**: Success End Condition

- **Given** submission status is displayed during the round  
- **When** the player views the status  
- **Then** the player can identify which players have already submitted

---

*UC-55 status: COMPLETE*

# UC-56 — View Players Who Have Not Submitted

## Source User Story
**US-56**: As a player, I want to see which players have not yet submitted so that I know the round is still in progress.

---

## Use Case (Cockburn Style)

**Goal in Context**: Show a player which players have not submitted their color in the current round so the player knows the round is still in progress.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Submission Service, Game UI System  
**Trigger**: The player views the round interface during an active round.

### Success End Condition
* The player can view an up-to-date list of which players have not submitted their color in the current round.

### Failed End Condition
* The player cannot view which players have not submitted and cannot tell whether the round is still in progress.

### Preconditions
* The player is participating in an active match.
* A round is active and players can submit colors.

### Main Success Scenario
1. The round is active and players are blending colors.
2. The system tracks which players have submitted their final blended color.
3. The system determines which players have not yet submitted.
4. The system displays the list of players who have not submitted to each player in the round.
5. The player views which players have not yet submitted.

### Extensions
* **2a**: The system cannot track submission status due to an error.  
  * **2a1**: The system displays an error message and does not display who has not submitted.
* **3a**: The system cannot determine who has not submitted.  
  * **3a1**: The system displays an error message and does not display who has not submitted.
* **4a**: The system fails to display the list to the player.  
  * **4a1**: The system displays an error message and prompts the player to retry viewing the list.

### Related Information
* **Priority**: Medium  
* **Frequency**: High  
* **Open Issues**: Whether the list is displayed as a separate view or alongside submitted players is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
During an active round, players blend colors and may submit at different times. The system tracks which players have submitted their final color.

Based on this tracking, the system determines which players have not yet submitted and displays that list to each player. A player can see who has not submitted and understand that the round is still in progress.

### Alternative Scenario 2a — Submission Tracking Error
The round is active and the system should track submissions. The system encounters an error and cannot track submission status.

The system displays an error message and does not display who has not submitted. The player cannot tell which players are still pending.

### Alternative Scenario 3a — Cannot Determine Non-Submitters
The system has partial submission information but cannot determine which players have not submitted due to an internal error.

The system displays an error message and does not display who has not submitted. The player cannot see who is still pending.

### Alternative Scenario 4a — List Not Displayed
The system determines which players have not submitted and attempts to display the list to a player. A display error occurs.

The system displays an error message and prompts the player to retry viewing the list. The player does not see the non-submitter list until display succeeds.

---

## Acceptance Test Suite

### AT-UC-56-01 — Non-Submitters List Displayed
**Covers**: Main Success Scenario

- **Given** a round is active and submissions may be pending  
- **When** the player views the round interface  
- **Then** the system displays which players have not yet submitted

### AT-UC-56-02 — Submission Tracking Error
**Covers**: Extension 2a

- **Given** a round is active  
- **When** the system cannot track submission status due to an error  
- **Then** the system displays an error message  
  **And** does not display who has not submitted

### AT-UC-56-03 — Cannot Determine Non-Submitters
**Covers**: Extension 3a

- **Given** submission tracking data exists  
- **When** the system cannot determine which players have not submitted  
- **Then** the system displays an error message  
  **And** does not display who has not submitted

### AT-UC-56-04 — List Not Displayed
**Covers**: Extension 4a

- **Given** the system determines which players have not submitted  
- **When** the system fails to display the list to the player  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing the list

### AT-UC-56-05 — No Misleading Pending List
**Covers**: All failure paths

- **Given** tracking, determination, or display fails  
- **Then** the system does not show a misleading list of non-submitters as accurate

### AT-UC-56-06 — Pending List Indicates Round In Progress
**Covers**: Success End Condition

- **Given** the system displays which players have not submitted  
- **When** the player views the list  
- **Then** the player can tell the round is still in progress

---

*UC-56 status: COMPLETE*

# UC-57 — View Submission Order

## Source User Story
**US-57**: As a player, I want to see the order in which players submit their colors so that the round feels more competitive.

---

## Use Case (Cockburn Style)

**Goal in Context**: Show the order of player submissions in the current round so players can see who submitted first, second, and so on.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Round Manager, Submission Service, Game UI System  
**Trigger**: A player submission is received during an active round.

### Success End Condition
* The player can view the submission order for the round based on when each player submitted.

### Failed End Condition
* The player cannot view submission order and does not know who submitted first.

### Preconditions
* The player is participating in an active match.
* A round is active and players can submit colors.

### Main Success Scenario
1. The round is active and players are blending colors.
2. The system receives a player’s color submission.
3. The system records the submission time for that player.
4. The system updates the submission order for the round.
5. The system displays the current submission order to each player.
6. The player views the submission order and sees who submitted first, second, and so on.

### Extensions
* **2a**: The system does not receive a submission from a player.  
  * **2a1**: The system does not assign a submission order position to that player.
* **3a**: The system cannot record the submission time.  
  * **3a1**: The system displays an error message and does not update submission order.
* **5a**: The system fails to display submission order to the player.  
  * **5a1**: The system displays an error message and prompts the player to retry viewing submission order.

### Related Information
* **Priority**: Medium  
* **Frequency**: Medium  
* **Open Issues**: Whether submission order is shown live during the round or only after round end is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
During an active round, players submit their final blended colors at different times. When a submission is received, the system records the time for that submission and updates the submission order.

The system displays the current submission order to all players. A player can view who submitted first, second, and so on, making the round feel more competitive as progress unfolds.

### Alternative Scenario 2a — No Submission Received From a Player
The round is active and the system is tracking submission order. A player has not submitted a color.

The system does not assign a submission order position to that player. Other players can still view the order among the submissions that have occurred.

### Alternative Scenario 3a — Submission Time Cannot Be Recorded
The system receives a color submission from a player. The system attempts to record the submission time but encounters an error.

The system displays an error message and does not update submission order. Players cannot view accurate submission order.

### Alternative Scenario 5a — Submission Order Not Displayed
The system updates submission order and attempts to display it to a player. A display error occurs and the player cannot see the submission order.

The system displays an error message and prompts the player to retry viewing submission order. The player does not see submission order until display succeeds.

---

## Acceptance Test Suite

### AT-UC-57-01 — Submission Order Displayed
**Covers**: Main Success Scenario

- **Given** a round is active and players can submit colors  
- **When** the system receives submissions from players  
- **Then** the system records submission times  
  **And** updates submission order  
  **And** displays the submission order to each player

### AT-UC-57-02 — No Submission Received From a Player
**Covers**: Extension 2a

- **Given** a round is active  
- **When** a player has not submitted a color  
- **Then** the system does not assign a submission order position to that player

### AT-UC-57-03 — Submission Time Cannot Be Recorded
**Covers**: Extension 3a

- **Given** the system receives a color submission  
- **When** the system cannot record the submission time  
- **Then** the system displays an error message  
  **And** does not update submission order

### AT-UC-57-04 — Submission Order Not Displayed
**Covers**: Extension 5a

- **Given** submission order is available to display  
- **When** the system fails to display submission order to the player  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing submission order

### AT-UC-57-05 — No Misleading Submission Order
**Covers**: All failure paths

- **Given** submission time recording or display fails  
- **Then** the system does not show a misleading submission order as accurate

### AT-UC-57-06 — Submission Order Supports Competitiveness
**Covers**: Success End Condition

- **Given** the submission order is displayed during the round  
- **When** the player views the submission order  
- **Then** the player can see who submitted first, second, and so on

---

*UC-57 status: COMPLETE*

# UC-58 — Confirm Submission Received

## Source User Story
**US-58**: As a player, I want a clear indication that my submission was received so that I am confident my entry counts.

---

## Use Case (Cockburn Style)

**Goal in Context**: Provide a clear confirmation to the player that their color submission was received so the player is confident it will count.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Submission Service, Game UI System  
**Trigger**: The player submits a final blended color.

### Success End Condition
* The player receives a clear confirmation that the submission was received.

### Failed End Condition
* The player does not receive confirmation and is not confident the submission counts.

### Preconditions
* The player is participating in an active match.
* A round is active and the player can submit a color.

### Main Success Scenario
1. The player selects submit for a final blended color.
2. The system receives the submission.
3. The system records the submission for the current round.
4. The system displays a clear confirmation to the player that the submission was received.
5. The player sees the confirmation and knows the entry counts.

### Extensions
* **2a**: The system does not receive the submission due to an error.  
  * **2a1**: The system displays an error message and does not confirm receipt.
* **3a**: The system cannot record the submission.  
  * **3a1**: The system displays an error message and does not confirm receipt.
* **4a**: The system fails to display the confirmation.  
  * **4a1**: The system displays an error message and prompts the player to retry.

### Related Information
* **Priority**: High  
* **Frequency**: High  
* **Open Issues**: The confirmation format (toast, banner, status icon) is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
A player finishes blending a color and submits the final result during an active round. The system receives the submission and records it for the round.

The system displays a clear confirmation that the submission was received. The player sees the confirmation and is confident that the entry will count for scoring.

### Alternative Scenario 2a — Submission Not Received
The player selects submit, but the system does not receive the submission due to an error.

The system displays an error message and does not confirm receipt. The player is not confident that the entry counts.

### Alternative Scenario 3a — Submission Cannot Be Recorded
The system receives the submission but cannot record it for the round due to a storage or processing error.

The system displays an error message and does not confirm receipt. The submission does not count.

### Alternative Scenario 4a — Confirmation Not Displayed
The system receives and records the submission successfully. The system then fails to display the confirmation to the player due to a UI error.

The system displays an error message and prompts the player to retry. The player does not receive confirmation until the display succeeds.

---

## Acceptance Test Suite

### AT-UC-58-01 — Confirmation Displayed After Submission
**Covers**: Main Success Scenario

- **Given** a round is active and the player can submit  
- **When** the player submits a final blended color  
- **Then** the system receives and records the submission  
  **And** displays a clear confirmation that the submission was received

### AT-UC-58-02 — Submission Not Received
**Covers**: Extension 2a

- **Given** the player submits a final blended color  
- **When** the system does not receive the submission due to an error  
- **Then** the system displays an error message  
  **And** does not confirm receipt

### AT-UC-58-03 — Submission Cannot Be Recorded
**Covers**: Extension 3a

- **Given** the system receives the submission  
- **When** the system cannot record the submission  
- **Then** the system displays an error message  
  **And** does not confirm receipt

### AT-UC-58-04 — Confirmation Not Displayed
**Covers**: Extension 4a

- **Given** the system receives and records the submission  
- **When** the system fails to display the confirmation  
- **Then** the system displays an error message  
  **And** prompts the player to retry

### AT-UC-58-05 — No Misleading Confirmation
**Covers**: All failure paths

- **Given** receipt, recording, or confirmation display fails  
- **Then** the system does not show a confirmation that implies the entry counts

### AT-UC-58-06 — Confirmation Supports Confidence Entry Counts
**Covers**: Success End Condition

- **Given** the system displays a submission received confirmation  
- **When** the player sees the confirmation  
- **Then** the player can be confident the entry counts

---

*UC-58 status: COMPLETE*

# UC-59 — Upvote or Highlight Submissions

## Source User Story
**US-59**: As a player, I want to be able to upvote or highlight interesting submissions so that creativity is recognized.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to upvote or highlight another player’s submission so interesting or creative submissions are recognized.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Results Display Service, Submission Service, Feedback Service  
**Trigger**: The player views submissions and selects an upvote or highlight action.

### Success End Condition
* The system records the player’s upvote or highlight for the selected submission and displays the updated recognition.

### Failed End Condition
* The system does not record the upvote or highlight and the submission is not recognized through that action.

### Preconditions
* The player is participating in an active match.
* Submissions for a round are available to view.

### Main Success Scenario
1. The player opens the round results view.
2. The system displays the submitted colors for the round.
3. The player selects a submission to upvote or highlight.
4. The system records the upvote or highlight for the selected submission.
5. The system displays an updated indication that the submission has been upvoted or highlighted.

### Extensions
* **2a**: The system cannot display submitted colors.  
  * **2a1**: The system displays an error message and does not allow upvote or highlight.
* **3a**: The player does not select any submission to upvote or highlight.  
  * **3a1**: The system displays submissions without recording any upvote or highlight.
* **4a**: The system encounters an error while recording the upvote or highlight.  
  * **4a1**: The system displays an error message and does not record the upvote or highlight.
* **5a**: The system fails to display the updated indication.  
  * **5a1**: The system displays an error message and prompts the player to retry viewing the updated indication.

### Related Information
* **Priority**: Low  
* **Frequency**: Medium  
* **Open Issues**: Whether upvotes are limited per player or per submission is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
After a round ends, a player opens the round results view and the system displays the submitted colors. The player sees an interesting submission and selects an option to upvote or highlight it.

The system records the upvote or highlight for that submission and displays an updated indication so players can see that the submission has been recognized.

### Alternative Scenario 2a — Submitted Colors Cannot Be Displayed
The player opens the round results view. The system cannot display submitted colors due to a display or retrieval error.

The system displays an error message and does not allow the player to upvote or highlight submissions because submissions are not available to select.

### Alternative Scenario 3a — No Upvote or Highlight Selected
The player opens the round results view and sees the submitted colors. The player chooses not to upvote or highlight any submission.

The system displays submissions without recording any upvote or highlight. No recognition action is applied.

### Alternative Scenario 4a — Recording Error
The player selects a submission to upvote or highlight. The system attempts to record the action but encounters an error.

The system displays an error message and does not record the upvote or highlight. The submission is not recognized through that action.

### Alternative Scenario 5a — Updated Indication Not Displayed
The system records the upvote or highlight successfully. The system then fails to display the updated indication due to a UI error.

The system displays an error message and prompts the player to retry viewing the updated indication. The player does not see the updated recognition until display succeeds.

---

## Acceptance Test Suite

### AT-UC-59-01 — Upvote or Highlight Recorded and Shown
**Covers**: Main Success Scenario

- **Given** round submissions are available to view  
- **When** the player selects a submission to upvote or highlight  
- **Then** the system records the upvote or highlight  
  **And** displays an updated indication that the submission was recognized

### AT-UC-59-02 — Submitted Colors Cannot Be Displayed
**Covers**: Extension 2a

- **Given** the player opens the round results view  
- **When** the system cannot display submitted colors  
- **Then** the system displays an error message  
  **And** does not allow upvote or highlight

### AT-UC-59-03 — No Upvote or Highlight Selected
**Covers**: Extension 3a

- **Given** submitted colors are displayed  
- **When** the player does not select any submission to upvote or highlight  
- **Then** the system records no upvote or highlight

### AT-UC-59-04 — Recording Error
**Covers**: Extension 4a

- **Given** submitted colors are displayed  
- **When** the system encounters an error recording the upvote or highlight  
- **Then** the system displays an error message  
  **And** does not record the upvote or highlight

### AT-UC-59-05 — Updated Indication Not Displayed
**Covers**: Extension 5a

- **Given** an upvote or highlight is recorded  
- **When** the system fails to display the updated indication  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing the updated indication

### AT-UC-59-06 — No Misleading Recognition Display
**Covers**: All failure paths

- **Given** display or recording fails  
- **Then** the system does not show an upvote or highlight indication that was not recorded

### AT-UC-59-07 — Creativity Recognition Available Through Upvote or Highlight
**Covers**: Success End Condition

- **Given** a player records an upvote or highlight for a submission  
- **When** round submissions are viewed  
- **Then** the submission shows recognition through the recorded upvote or highlight

---

*UC-59 status: COMPLETE*

# UC-60 — View Crowd Favorite Submission

## Source User Story
**US-60**: As a player, I want to see which submission was the crowd favorite so that social approval is visible.

---

## Use Case (Cockburn Style)

**Goal in Context**: Show which submission received the highest crowd recognition so social approval is visible to players.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Results Display Service, Feedback Service  
**Trigger**: The player views round results after submissions are finalized.

### Success End Condition
* The system identifies and displays the crowd favorite submission for the round.

### Failed End Condition
* The system does not display a crowd favorite submission.

### Preconditions
* The player is participating in an active match.
* Submissions for the round are finalized.
* Crowd feedback (e.g., upvotes or highlights) exists for the round.

### Main Success Scenario
1. The round ends and submissions are finalized.
2. The system aggregates crowd feedback for all submissions in the round.
3. The system determines the submission with the highest crowd recognition.
4. The system displays the crowd favorite submission to the player.
5. The player views which submission was the crowd favorite.

### Extensions
* **2a**: The system cannot aggregate crowd feedback.  
  * **2a1**: The system displays an error message and does not determine a crowd favorite.
* **3a**: The system cannot determine a unique crowd favorite.  
  * **3a1**: The system displays a message indicating no single crowd favorite.
* **4a**: The system fails to display the crowd favorite submission.  
  * **4a1**: The system displays an error message and prompts the player to retry viewing results.

### Related Information
* **Priority**: Low  
* **Frequency**: Medium  
* **Open Issues**: How ties in crowd recognition are resolved is not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
After a round ends, the system finalizes submissions and aggregates crowd feedback such as upvotes or highlights. Based on this aggregation, the system determines which submission received the highest level of crowd recognition.

The system displays the crowd favorite submission to the player. The player can see which submission received the most social approval.

### Alternative Scenario 2a — Crowd Feedback Cannot Be Aggregated
The round ends and submissions are finalized. The system attempts to aggregate crowd feedback but encounters an error.

The system displays an error message and does not determine or display a crowd favorite submission.

### Alternative Scenario 3a — No Unique Crowd Favorite
The system aggregates crowd feedback successfully but cannot determine a single crowd favorite because recognition is tied.

The system displays a message indicating that there is no single crowd favorite for the round.

### Alternative Scenario 4a — Crowd Favorite Not Displayed
The system determines the crowd favorite submission but fails to display it due to a display error.

The system displays an error message and prompts the player to retry viewing results. The player does not see the crowd favorite until display succeeds.

---

## Acceptance Test Suite

### AT-UC-60-01 — Crowd Favorite Displayed
**Covers**: Main Success Scenario

- **Given** round submissions are finalized and crowd feedback exists  
- **When** the player views round results  
- **Then** the system aggregates crowd feedback  
  **And** determines and displays the crowd favorite submission

### AT-UC-60-02 — Crowd Feedback Cannot Be Aggregated
**Covers**: Extension 2a

- **Given** submissions are finalized  
- **When** the system cannot aggregate crowd feedback  
- **Then** the system displays an error message  
  **And** does not display a crowd favorite

### AT-UC-60-03 — No Unique Crowd Favorite
**Covers**: Extension 3a

- **Given** crowd feedback is aggregated  
- **When** no single submission has the highest recognition  
- **Then** the system displays a message indicating no single crowd favorite

### AT-UC-60-04 — Crowd Favorite Not Displayed
**Covers**: Extension 4a

- **Given** a crowd favorite is determined  
- **When** the system fails to display it  
- **Then** the system displays an error message  
  **And** prompts the player to retry viewing results

### AT-UC-60-05 — No Misleading Crowd Favorite Display
**Covers**: All failure paths

- **Given** aggregation, determination, or display fails  
- **Then** the system does not show an incorrect crowd favorite

### AT-UC-60-06 — Crowd Favorite Shows Social Approval
**Covers**: Success End Condition

- **Given** the crowd favorite submission is displayed  
- **When** the player views it  
- **Then** the player can see which submission received the most social approval

---

*UC-60 status: COMPLETE*

# UC-61 — Send Preset Messages

## Source User Story
**US-61**: As a player, I want to send short preset messages (e.g., “Nice!”, “So close!”) so that interaction is safe and controlled.

---

## Use Case (Cockburn Style)

**Goal in Context**: Allow a player to send short preset messages during a match so interaction remains safe and controlled.  
**Scope**: Blend Colour Game System  
**Level**: User Goal  
**Primary Actor**: Player  
**Secondary Actors**: Messaging Service, Room Manager, Game UI System  
**Trigger**: The player selects a preset message to send.

### Success End Condition
* The selected preset message is delivered to players in the room and displayed.

### Failed End Condition
* The preset message is not delivered or displayed.

### Preconditions
* The player is in a room during an active match.
* Preset messages are available to select.

### Main Success Scenario
1. The player opens the preset message control in the room.
2. The system displays a list of available preset messages.
3. The player selects a preset message to send.
4. The system sends the selected preset message to the room.
5. The system displays the preset message to players in the room.

### Extensions
* **2a**: The system cannot display the preset message list.  
  * **2a1**: The system displays an error message and does not allow sending a preset message.
* **4a**: The system encounters an error sending the preset message.  
  * **4a1**: The system displays an error message and does not deliver the message to the room.
* **5a**: The system fails to display the delivered preset message.  
  * **5a1**: The system displays an error message and does not show the message to players.

### Related Information
* **Priority**: Low  
* **Frequency**: Medium  
* **Open Issues**: The exact preset message set and when messaging is available are not specified.

---

## Fully Dressed Scenario Narratives

### Main Success Scenario Narrative
During a match, a player opens the preset message control and the system shows a list of short preset messages such as “Nice!” and “So close!”. The player selects one message to send.

The system sends the selected preset message to the room and displays it to players. Communication stays safe and controlled because only preset messages can be sent.

### Alternative Scenario 2a — Preset Message List Not Displayed
The player opens the preset message control. The system cannot display the list of available preset messages due to a UI or retrieval error.

The system displays an error message and does not allow the player to send a preset message.

### Alternative Scenario 4a — Preset Message Cannot Be Sent
The player selects a preset message to send. The system encounters an error while sending the message to the room.

The system displays an error message and does not deliver the message.

### Alternative Scenario 5a — Delivered Message Not Displayed
The system sends the preset message successfully. The system then fails to display the delivered message to players due to a display error.

The system displays an error message and does not show the message to players.

---

## Acceptance Test Suite

### AT-UC-61-01 — Preset Message Sent and Displayed
**Covers**: Main Success Scenario

- **Given** the player is in a room and preset messages are available  
- **When** the player selects a preset message to send  
- **Then** the system sends the selected preset message to the room  
  **And** displays the message to players in the room

### AT-UC-61-02 — Preset Message List Not Displayed
**Covers**: Extension 2a

- **Given** the player opens the preset message control  
- **When** the system cannot display the preset message list  
- **Then** the system displays an error message  
  **And** does not allow sending a preset message

### AT-UC-61-03 — Preset Message Cannot Be Sent
**Covers**: Extension 4a

- **Given** the player selects a preset message  
- **When** the system encounters an error sending the message  
- **Then** the system displays an error message  
  **And** does not deliver the message to the room

### AT-UC-61-04 — Delivered Message Not Displayed
**Covers**: Extension 5a

- **Given** the system sends a preset message to the room  
- **When** the system fails to display the delivered message  
- **Then** the system displays an error message  
  **And** does not show the message to players

### AT-UC-61-05 — No Message Shown Without Delivery
**Covers**: All failure paths

- **Given** message list display or sending fails  
- **Then** no preset message is shown as delivered to the room

### AT-UC-61-06 — Preset Messages Keep Interaction Controlled
**Covers**: Success End Condition

- **Given** only preset messages are available to send  
- **When** a player communicates in the room  
- **Then** communication is limited to preset messages and remains safe and controlled

---

*UC-61 status: COMPLETE*
