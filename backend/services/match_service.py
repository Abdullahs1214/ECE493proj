from __future__ import annotations

from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import PlayerIdentity
from apps.gameplay.models import Match, Round, ScoreRecord, Submission
from apps.gameplay.validators import remaining_seconds, validate_color_ranges
from apps.rooms.models import RoomMembership
from engine.round_engine import (
    create_round_for_match,
    finalize_round_if_ready,
    register_submission,
)
from services.history_service import record_score_history
from websockets.results_publisher import publish_result_publication, publish_scoring_update
from websockets.submission_publisher import (
    publish_submission_receipt,
    publish_submission_rejection,
)


def _match_players(match: Match) -> list[PlayerIdentity]:
    if match.mode == Match.Mode.SINGLE_PLAYER:
        submission = (
            Submission.objects.select_related("player")
            .filter(round__match=match)
            .order_by("submitted_at")
            .first()
        )
        if submission is not None:
            return [submission.player]
        return []

    memberships = (
        match.room.memberships.select_related("player")
        .filter(membership_status=RoomMembership.MembershipStatus.ACTIVE)
    )
    return [membership.player for membership in memberships]


def _serialize_score_record(score_record: ScoreRecord) -> dict[str, Any]:
    submission = (
        Submission.objects.filter(round=score_record.round, player=score_record.player).first()
    )
    return {
        "playerId": str(score_record.player.player_id),
        "displayName": score_record.player.display_name,
        "blendedColor": submission.blended_color if submission else None,
        "colorDistance": score_record.color_distance,
        "score": score_record.score,
        "similarityPercentage": score_record.similarity_percentage,
        "rank": score_record.rank,
        "tieBreakBasis": score_record.tie_break_basis,
    }


def serialize_match_state(match: Match) -> dict[str, Any]:
    round_instance = match.rounds.order_by("-round_number").first()
    if round_instance is None:
        raise ValueError("Match does not have a round.")

    finalize_round_if_ready(match)
    match.refresh_from_db()
    round_instance.refresh_from_db()

    submissions = list(
        round_instance.submissions.select_related("player").order_by("submission_order", "submitted_at")
    )
    score_records = list(
        round_instance.score_records.select_related("player").order_by("rank", "score_record_id")
    )
    return {
        "matchId": str(match.match_id),
        "mode": match.mode,
        "matchStatus": match.match_status,
        "currentRoundNumber": match.current_round_number,
        "round": {
            "roundId": str(round_instance.round_id),
            "roundNumber": round_instance.round_number,
            "roundStatus": round_instance.round_status,
            "targetColor": round_instance.target_color,
            "baseColorSet": round_instance.base_color_set,
            "timeLimit": round_instance.time_limit,
            "remainingSeconds": remaining_seconds(round_instance),
        },
        "submissions": [
            {
                "playerId": str(submission.player.player_id),
                "displayName": submission.player.display_name,
                "submissionStatus": submission.submission_status,
                "submissionOrder": submission.submission_order,
                "blendedColor": submission.blended_color,
            }
            for submission in submissions
        ],
        "results": [_serialize_score_record(score_record) for score_record in score_records],
    }


def _record_history_for_match(match: Match) -> None:
    if match.match_status not in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]:
        return
    round_instance = match.rounds.order_by("-round_number").first()
    if round_instance is None:
        return
    for score_record in round_instance.score_records.select_related("player").all():
        record_score_history(score_record)


@transaction.atomic
def start_single_player_match(player: PlayerIdentity) -> Match:
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )
    create_round_for_match(match)
    return match


@transaction.atomic
def start_multiplayer_match(player: PlayerIdentity, room_id: str) -> Match:
    membership = (
        RoomMembership.objects.select_related("room", "player")
        .filter(room_id=room_id, player=player, membership_status=RoomMembership.MembershipStatus.ACTIVE)
        .first()
    )
    if membership is None:
        raise ValueError("Player is not an active member of this room.")

    active_memberships = list(
        membership.room.memberships.select_related("player").filter(
            membership_status=RoomMembership.MembershipStatus.ACTIVE
        )
    )
    if len(active_memberships) < 2:
        raise ValueError("At least two players are required to start multiplayer gameplay.")

    existing_match = membership.room.matches.exclude(match_status=Match.MatchStatus.ENDED).first()
    if existing_match is not None:
        raise ValueError("A gameplay session is already active for this room.")

    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=membership.room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=len(active_memberships),
    )
    create_round_for_match(match)
    return match


@transaction.atomic
def submit_color(player: PlayerIdentity, match_id: str, blended_color: list[int]) -> Match:
    match = Match.objects.select_related("room").filter(match_id=match_id).first()
    if match is None:
        raise ValueError("Match was not found.")
    if match.match_status not in [Match.MatchStatus.ACTIVE_ROUND, Match.MatchStatus.RESULTS]:
        raise ValueError("Match is not accepting submissions.")

    validate_color_ranges(blended_color)

    if match.mode == Match.Mode.MULTIPLAYER:
        membership = RoomMembership.objects.filter(
            room=match.room,
            player=player,
            membership_status=RoomMembership.MembershipStatus.ACTIVE,
        ).first()
        if membership is None:
            raise ValueError("Player is not active in the room for this match.")

    round_instance = match.rounds.order_by("-round_number").first()
    if round_instance is None:
        raise ValueError("Match round was not found.")

    try:
        register_submission(round_instance, player, blended_color)
    except ValueError as exc:
        publish_submission_rejection(match_id, player, str(exc))
        raise
    finalize_round_if_ready(match)
    _record_history_for_match(match)
    publish_submission_receipt(match)
    if match.match_status in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]:
        publish_scoring_update(match)
        publish_result_publication(match)
    return match


def get_match_state(player: PlayerIdentity, match_id: str) -> Match:
    match = Match.objects.select_related("room").filter(match_id=match_id).first()
    if match is None:
        raise ValueError("Match was not found.")

    if match.mode == Match.Mode.MULTIPLAYER:
        membership = RoomMembership.objects.filter(
            room=match.room,
            player=player,
            membership_status=RoomMembership.MembershipStatus.ACTIVE,
        ).first()
        if membership is None:
            raise ValueError("Player is not active in the room for this match.")

    finalize_round_if_ready(match)
    _record_history_for_match(match)
    return match
