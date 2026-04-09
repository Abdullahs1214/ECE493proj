from __future__ import annotations

from typing import Any

from django.db import transaction
from django.conf import settings
from django.utils import timezone

from apps.accounts.models import PlayerIdentity
from apps.gameplay.models import Match, Round, ScoreRecord, Submission
from apps.rooms.models import Room, RoomMembership
from apps.gameplay.validators import remaining_seconds, validate_color_ranges
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

DEFAULT_MATCH_ROUNDS = getattr(settings, "DEFAULT_MATCH_ROUNDS", 3)
RESULTS_VIEW_SECONDS = 5


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


def _is_final_round(match: Match) -> bool:
    return match.current_round_number >= DEFAULT_MATCH_ROUNDS


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

    stored_submissions = list(
        round_instance.submissions.select_related("player").order_by("submission_order", "submitted_at")
    )
    submission_by_player_id = {
        submission.player_id: submission for submission in stored_submissions
    }
    submissions: list[dict[str, Any]] = []
    for player in _match_players(match):
        submission = submission_by_player_id.get(player.player_id)
        if submission is None:
            submissions.append(
                {
                    "playerId": str(player.player_id),
                    "displayName": player.display_name,
                    "submissionStatus": "waiting",
                    "submissionOrder": None,
                    "blendedColor": [],
                }
            )
            continue

        submissions.append(
            {
                "playerId": str(submission.player.player_id),
                "displayName": submission.player.display_name,
                "submissionStatus": submission.submission_status,
                "submissionOrder": submission.submission_order,
                "blendedColor": submission.blended_color,
            }
        )

    score_records = list(
        round_instance.score_records.select_related("player").order_by("rank", "score_record_id")
    )
    return {
        "matchId": str(match.match_id),
        "mode": match.mode,
        "matchStatus": match.match_status,
        "currentRoundNumber": match.current_round_number,
        "totalRounds": DEFAULT_MATCH_ROUNDS,
        "canAdvance": match.match_status == Match.MatchStatus.RESULTS and not _is_final_round(match),
        "round": {
            "roundId": str(round_instance.round_id),
            "roundNumber": round_instance.round_number,
            "roundStatus": round_instance.round_status,
            "targetColor": round_instance.target_color,
            "baseColorSet": round_instance.base_color_set,
            "timeLimit": round_instance.time_limit,
            "remainingSeconds": remaining_seconds(round_instance),
        },
        "submissions": submissions,
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


def _sync_room_after_match_state(match: Match) -> None:
    if match.mode != Match.Mode.MULTIPLAYER or match.room is None:
        return

    from websockets.presence_publisher import publish_room_state

    room = match.room
    if match.match_status == Match.MatchStatus.ENDED:
        room.room_status = Room.RoomStatus.OPEN
        room.join_policy = Room.JoinPolicy.OPEN
        room.save(update_fields=["room_status", "join_policy"])
        room.memberships.filter(
            membership_status=RoomMembership.MembershipStatus.WAITING_FOR_NEXT_GAME
        ).update(membership_status=RoomMembership.MembershipStatus.ACTIVE)
        room.refresh_from_db()
        publish_room_state(room)
    elif match.match_status in [
        Match.MatchStatus.WAITING_FOR_PLAYERS,
        Match.MatchStatus.ACTIVE_ROUND,
        Match.MatchStatus.SCORING,
        Match.MatchStatus.RESULTS,
    ]:
        room.room_status = Room.RoomStatus.ACTIVE_MATCH
        room.join_policy = Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
        room.save(update_fields=["room_status", "join_policy"])
        room.refresh_from_db()
        publish_room_state(room)


def _advance_match_if_ready(match: Match) -> bool:
    if match.match_status != Match.MatchStatus.RESULTS or _is_final_round(match):
        return False

    round_instance = match.rounds.order_by("-round_number").first()
    if round_instance is None or round_instance.ended_at is None:
        return False
    if timezone.now() < round_instance.ended_at + timezone.timedelta(seconds=RESULTS_VIEW_SECONDS):
        return False

    from websockets.match_publisher import publish_round_start

    match.current_round_number += 1
    match.match_status = Match.MatchStatus.ACTIVE_ROUND
    match.save(update_fields=["current_round_number", "match_status"])
    create_round_for_match(match)
    _sync_room_after_match_state(match)
    publish_round_start(match)
    return True


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
    membership.room.room_status = Room.RoomStatus.ACTIVE_MATCH
    membership.room.join_policy = Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
    membership.room.save(update_fields=["room_status", "join_policy"])
    create_round_for_match(match)
    _sync_room_after_match_state(match)
    return match


@transaction.atomic
def submit_color(
    player: PlayerIdentity,
    match_id: str,
    blended_color: list[int] | None = None,
    mix_weights: list[int] | None = None,
) -> Match:
    match = Match.objects.select_related("room").filter(match_id=match_id).first()
    if match is None:
        raise ValueError("Match was not found.")
    if match.match_status not in [Match.MatchStatus.ACTIVE_ROUND, Match.MatchStatus.RESULTS]:
        raise ValueError("Match is not accepting submissions.")

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
        register_submission(
            round_instance,
            player,
            blended_color=blended_color,
            mix_weights=mix_weights,
        )
    except ValueError as exc:
        publish_submission_rejection(match_id, player, str(exc))
        raise
    finalize_round_if_ready(match)
    advanced = _advance_match_if_ready(match)
    if advanced:
        match.refresh_from_db()
    _record_history_for_match(match)
    _sync_room_after_match_state(match)
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
    advanced = _advance_match_if_ready(match)
    if advanced:
        match.refresh_from_db()
    _record_history_for_match(match)
    _sync_room_after_match_state(match)
    return match
