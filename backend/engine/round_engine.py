from __future__ import annotations

from django.utils import timezone

from apps.accounts.models import PlayerIdentity
from apps.gameplay.models import Match, Round, Submission
from apps.gameplay.validators import validate_color_ranges, validate_submission_window
from apps.rooms.models import RoomMembership
from engine.scoring_engine import build_score_records, generate_base_color_set, generate_target_color


def create_round_for_match(match: Match) -> Round:
    return Round.objects.create(
        match=match,
        round_number=match.current_round_number,
        target_color=generate_target_color(),
        base_color_set=generate_base_color_set(),
        time_limit=60,
        round_status=Round.RoundStatus.ACTIVE_BLENDING,
    )


def register_submission(round_instance: Round, player: PlayerIdentity, blended_color: list[int]) -> Submission:
    validate_color_ranges(blended_color)
    validate_submission_window(round_instance)

    if Submission.objects.filter(round=round_instance, player=player).exists():
        raise ValueError("Submission already received for this round.")

    submission_order = round_instance.submissions.filter(
        submission_status=Submission.SubmissionStatus.ACCEPTED
    ).count() + 1
    return Submission.objects.create(
        round=round_instance,
        player=player,
        blended_color=blended_color,
        submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=submission_order,
    )


def _create_missing_multiplayer_submissions(round_instance: Round, match: Match) -> None:
    if match.mode != Match.Mode.MULTIPLAYER or match.room is None:
        return

    active_players = [
        membership.player
        for membership in match.room.memberships.select_related("player").filter(
            membership_status=RoomMembership.MembershipStatus.ACTIVE
        )
    ]

    existing_player_ids = set(
        round_instance.submissions.values_list("player_id", flat=True)
    )

    submission_order = round_instance.submissions.filter(
        submission_status=Submission.SubmissionStatus.ACCEPTED
    ).count()

    for player in active_players:
        if player.player_id in existing_player_ids:
            continue

        submission_order += 1
        Submission.objects.create(
            round=round_instance,
            player=player,
            blended_color=[0, 0, 0],
            submission_status=Submission.SubmissionStatus.ACCEPTED,
            submission_order=submission_order,
        )


def finalize_round_if_ready(match: Match) -> None:
    round_instance = match.rounds.order_by("-round_number").first()
    if round_instance is None:
        return

    if round_instance.round_status == Round.RoundStatus.RESULTS:
        return

    expired = timezone.now() >= round_instance.started_at + timezone.timedelta(
        seconds=round_instance.time_limit
    )
    accepted_count = round_instance.submissions.filter(
        submission_status=Submission.SubmissionStatus.ACCEPTED
    ).count()

    if not expired and accepted_count < match.participant_count:
        return

    if expired:
        _create_missing_multiplayer_submissions(round_instance, match)

    round_instance.round_status = Round.RoundStatus.SUBMISSION_CLOSED
    round_instance.ended_at = timezone.now()
    round_instance.save(update_fields=["round_status", "ended_at"])

    match.match_status = Match.MatchStatus.SCORING
    match.save(update_fields=["match_status"])

    build_score_records(round_instance)

    round_instance.round_status = Round.RoundStatus.RESULTS
    round_instance.save(update_fields=["round_status"])
    match.match_status = Match.MatchStatus.RESULTS
    match.ended_at = timezone.now()
    match.save(update_fields=["match_status", "ended_at"])