from unittest.mock import patch

from django.test import TestCase

from services.identity_service import create_guest_session
from services.match_service import start_single_player_match, submit_color
from services.social_service import get_social_state, submit_social_interaction


class SocialTests(TestCase):
    @patch("engine.scoring_engine.random.randint", side_effect=[90, 100, 110])
    def test_upvote_and_highlight_create_crowd_favorite(self, _mock_randint) -> None:
        player = create_guest_session("Player One").player
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [90, 100, 110])
        round_instance = match.rounds.first()
        submission = round_instance.submissions.first()

        submit_social_interaction(
            player,
            str(match.match_id),
            "upvote",
            str(submission.submission_id),
        )
        submit_social_interaction(
            player,
            str(match.match_id),
            "highlight",
            str(submission.submission_id),
        )

        social_state = get_social_state(player, str(match.match_id))
        self.assertEqual(social_state["crowdFavorite"]["displayName"], "Player One")
        self.assertEqual(social_state["crowdFavorite"]["reactionCount"], 2)
        self.assertEqual(social_state["submissionSummaries"][0]["upvoteCount"], 1)
        self.assertEqual(social_state["submissionSummaries"][0]["highlightCount"], 1)

    @patch("engine.scoring_engine.random.randint", side_effect=[90, 100, 110])
    def test_preset_message_is_recorded(self, _mock_randint) -> None:
        player = create_guest_session("Player One").player
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [90, 100, 110])

        submit_social_interaction(
            player,
            str(match.match_id),
            "preset_message",
            preset_message="Nice blend!",
        )

        social_state = get_social_state(player, str(match.match_id))
        self.assertEqual(social_state["interactions"][0]["presetMessage"], "Nice blend!")
        self.assertEqual(social_state["presetMessages"], ["Nice blend!", "Great match!", "So close!"])

    @patch("engine.scoring_engine.random.randint", side_effect=[90, 100, 110])
    def test_non_participant_cannot_interact(self, _mock_randint) -> None:
        player = create_guest_session("Player One").player
        outsider = create_guest_session("Player Two").player
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [90, 100, 110])
        submission = match.rounds.first().submissions.first()

        with self.assertRaisesMessage(ValueError, "Player is not a participant in this match."):
            submit_social_interaction(
                outsider,
                str(match.match_id),
                "upvote",
                str(submission.submission_id),
            )

    @patch("engine.scoring_engine.random.randint", side_effect=[90, 100, 110])
    def test_submission_reaction_requires_target_submission_id(self, _mock_randint) -> None:
        player = create_guest_session("Player One").player
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [90, 100, 110])

        with self.assertRaisesMessage(
            ValueError,
            "targetSubmissionId is required for submission reactions.",
        ):
            submit_social_interaction(player, str(match.match_id), "upvote")

    @patch("engine.scoring_engine.random.randint", side_effect=[90, 100, 110])
    def test_submission_reaction_rejects_unknown_target_submission(self, _mock_randint) -> None:
        player = create_guest_session("Player One").player
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [90, 100, 110])

        with self.assertRaisesMessage(ValueError, "Target submission was not found."):
            submit_social_interaction(
                player,
                str(match.match_id),
                "upvote",
                "00000000-0000-0000-0000-000000000001",
            )
