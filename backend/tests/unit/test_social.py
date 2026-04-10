from unittest.mock import patch

from django.test import TestCase

from apps.gameplay.models import Match, Round
from engine.round_engine import register_submission
from services.identity_service import create_guest_session
from services.match_service import start_single_player_match, submit_color
from services.room_service import create_room, join_room
from services.social_service import get_social_state, submit_social_interaction


class SocialTests(TestCase):
    @patch("engine.scoring_engine.random.randint", side_effect=[10, 20, 30])
    def test_upvote_and_highlight_create_crowd_favorite(self, _mock_randint) -> None:
        host = create_guest_session("Player One").player
        guest = create_guest_session("Player Two").player
        room = create_room(host)
        join_room(guest, str(room.room_id))
        match = Match.objects.create(
            mode=Match.Mode.MULTIPLAYER,
            room=room,
            match_status=Match.MatchStatus.RESULTS,
            current_round_number=1,
            participant_count=2,
        )
        round_instance = Round.objects.create(
            match=match,
            round_number=1,
            target_color=[10, 20, 30],
            base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
            time_limit=60,
            round_status=Round.RoundStatus.ACTIVE_BLENDING,
        )
        register_submission(round_instance, host, blended_color=[10, 20, 30])
        round_instance.round_status = Round.RoundStatus.RESULTS
        round_instance.save(update_fields=["round_status"])
        submission = round_instance.submissions.first()

        submit_social_interaction(guest, str(match.match_id), "upvote", str(submission.submission_id))
        submit_social_interaction(guest, str(match.match_id), "highlight", str(submission.submission_id))

        social_state = get_social_state(guest, str(match.match_id))
        self.assertEqual(social_state["crowdFavorites"][0]["displayName"], "Player One")
        self.assertEqual(social_state["crowdFavorites"][0]["reactionCount"], 2)
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
