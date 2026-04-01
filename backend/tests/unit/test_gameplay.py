from unittest.mock import patch

from django.test import TestCase

from apps.gameplay.validators import validate_color_ranges
from services.identity_service import create_guest_session
from services.match_service import serialize_match_state, start_single_player_match, submit_color


class GameplayTests(TestCase):
    @patch("engine.scoring_engine.random.randint", side_effect=[100, 120, 140])
    def test_single_player_submission_creates_results(self, _mock_randint) -> None:
        session = create_guest_session("Solo")
        match = start_single_player_match(session.player)

        submit_color(session.player, str(match.match_id), [100, 120, 140])

        state = serialize_match_state(match)
        self.assertEqual(state["matchStatus"], "results")
        self.assertEqual(state["results"][0]["rank"], 1)
        self.assertEqual(state["results"][0]["displayName"], "Solo")

    def test_color_validator_rejects_invalid_channels(self) -> None:
        with self.assertRaises(ValueError):
            validate_color_ranges([300, 10, 10])
