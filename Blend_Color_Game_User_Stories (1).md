# 🎮 Blend Color Game --- User Stories

## Player Account & Identity

1.  As a player, I want to sign in using OAuth 2.0 (e.g., Google/GitHub)
    so that I can access the game without creating a new password.
2.  As a player, I want to play as a guest without logging in so that I
    can try the game quickly.
3.  As a guest player, I want the system to generate a temporary guest
    name so that I can be identified during a match.
4.  As a guest player, I want to edit my display name before joining a
    room so that I can choose how I appear to others.
5.  As a signed-in player, I want my display name and profile avatar to
    be shown in the lobby so that other players can recognize me.
6.  As a signed-in player, I want the system to link my OAuth identity
    to a unique user ID so that my progress and stats are stored
    correctly.
7.  As a signed-in player, I want my session to stay active for a period
    of time so that I don't have to log in repeatedly.
8.  As a player, I want to log out so that I can switch accounts or end
    my authenticated session.
9.  As a guest player, I want my session to expire automatically after
    inactivity so that temporary access is managed safely.
10. As a player, I want the system to prevent duplicate display names
    within the same room so that players are not confused.
11. As a player, I want the system to support reconnecting to the same
    room (guest or signed-in) after a disconnect so that I can continue
    the match.

## Color Panel & Blending

12. As a player, I want a color-blending panel so that I can mix colors
    interactively.
13. As a player, I want all players to receive the same base colors so
    that the competition is fair.
14. As a player, I want to adjust color values using sliders so that
    blending is intuitive.
15. As a player, I want to blend colors in real time so that I can
    instantly see the result.
16. As a player, I want to reset my selected colors so that I can
    restart blending if needed.
17. As a player, I want color values to stay within valid ranges so that
    invalid colors cannot be chosen.
18. As a player, I want to preview my final blended color before
    submitting it so that I can verify my choice.

## Target Color & Scoring

19. As a player, I want to see a target color so that I know what I am
    trying to match.
20. As a player, I want the target color to be generated randomly so
    that each round is unique.
21. As a player, I want the system to calculate the distance between my
    color and the target color so that scoring is objective.
22. As a player, I want my score to reflect how close my color is to the
    target color so that accuracy matters.
23. As a player, I want to see my similarity percentage so that I
    understand my performance.
24. As a player, I want the system to rank players by closeness so that
    a winner can be determined.
25. As a player, I want ties in score to be resolved using a clear and
    consistent rule so that match results are not ambiguous.
26. As a player, I want the tie-breaking rule to be visible or explained
    so that I understand how final rankings are determined.

## Game Flow & Rounds

27. As a player, I want each round to have a time limit so that the game
    stays fast-paced.
28. As a player, I want to see a countdown timer so that I know how much
    time remains.
29. As a player, I want the round to end automatically when time expires
    so that gameplay proceeds smoothly.
30. As a player, I want to submit my blended color before the timer ends
    so that it counts for scoring.
31. As a player, I want submissions made after the round timer expires
    to be rejected so that no one gains an unfair advantage.
32. As a player, I want to play multiple rounds in a match so that
    competition is meaningful.
33. As a player, I want to view round results before the next round
    begins so that I can learn from them.

## Results & Feedback

34. As a player, I want to see all submitted colors after a round so
    that I can compare outcomes.
35. As a player, I want the winning color/player to be highlighted so
    that the result is clear.
36. As a player, I want to see the exact target color after scoring so
    that I understand the difference.
37. I want visual feedback showing how close my color was to the target
    so that improvement is possible.

## Multiplayer & System

38. As a player, I want all players to receive the same game state from
    the server so that gameplay is synchronized.
39. As a player, I want the game to start only when enough players have
    joined so that the match is fair. if in a room, if single then you
    can choose single mode
40. As a player, I want the game to handle players leaving mid-round so
    that others can continue playing.
41. As a player, I want the lobby to be locked against new players
    joining once a game starts so that fairness and synchronization are
    preserved.
42. As a player, I want players who join a room after a game has started
    to wait until the next game begins so that ongoing rounds are not
    affected.

## Additional Gameplay & Room Requirements

43. As a player, I want to choose between single-player mode and
    multiplayer mode so that I can play alone or with others.
44. As a single-player user, I want to play against the system so that I
    can practice without joining a room.
45. As a multiplayer player, I want to create or join a game room so
    that I can compete with others.
46. As a room host, I want to be clearly identified so that players know
    who controls the room.
47. As a room host, I want exclusive permission to delete the room so
    that room management is controlled.
48. As a non-host player, I want to be prevented from deleting the room
    so that accidental shutdowns cannot occur.
49. As a player, I want the game to automatically close the room when
    the host leaves or deletes it so that the system remains consistent.
50. As a player, I want my scoring history to be stored per room so that
    results are separated between matches.
51. As a player, I want my scores to be linked to my user identity
    (OAuth) so that performance tracking is accurate.
52. As a player, I want to view my score history within the current room
    so that I can track round-by-round progress.
53. As a signed-in player, I want my room scoring history to persist
    after leaving so that I can review past matches.
54. As a guest player, I want my scoring history to exist only for the
    duration of the room so that temporary sessions remain lightweight.

## More information to players:

55. As a player, I want to see which players have already submitted
    their color so that I know who is finished.
56. As a player, I want to see which players have not yet submitted so
    that I know the round is still in progress.
57. As a player, I want to see the order in which players submit their
    colors so that the round feels more competitive.
58. As a player, I want a clear indication that my submission was
    received so that I am confident my entry counts.

## Social:

59. As a player, I want to be able to upvote or highlight interesting
    submissions so that creativity is recognized.
60. As a player, I want to see which submission was the crowd favorite
    so that social approval is visible.
61. As a player, I want to send short preset messages (e.g., "Nice!",
    "So close!") so that interaction is safe and controlled.
