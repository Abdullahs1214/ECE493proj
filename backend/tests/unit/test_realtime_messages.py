from django.test import SimpleTestCase

from websockets.messages import (
    match_start_update,
    result_publication,
    room_state_update,
    social_interaction_update,
    submission_rejection_update,
    timer_update,
)


class RealtimeMessageTests(SimpleTestCase):
    def test_room_state_update_serializes_room_payload(self) -> None:
        payload = room_state_update("room-1", {"roomId": "room-1", "members": []})

        self.assertEqual(payload["event"], "room_state_update")
        self.assertEqual(payload["roomId"], "room-1")
        self.assertEqual(payload["room"]["roomId"], "room-1")

    def test_match_and_result_messages_use_reserved_event_names(self) -> None:
        self.assertEqual(match_start_update("match-1", "room-1")["event"], "match_start_update")
        self.assertEqual(
            result_publication({"matchId": "match-1", "results": []})["event"],
            "result_publication",
        )
        self.assertEqual(
            social_interaction_update("match-1")["event"],
            "social_interaction_update",
        )

    def test_submission_rejection_includes_player_and_error(self) -> None:
        payload = submission_rejection_update("match-1", "player-1", "Too late.")

        self.assertEqual(payload["matchId"], "match-1")
        self.assertEqual(payload["playerId"], "player-1")
        self.assertEqual(payload["error"], "Too late.")

    def test_timer_update_includes_gameplay_payload(self) -> None:
        payload = timer_update({"matchId": "match-1", "matchStatus": "active_round"})

        self.assertEqual(payload["event"], "timer_update")
        self.assertEqual(payload["matchId"], "match-1")
