from __future__ import annotations

from typing import Any

from django.utils import timezone

from apps.accounts.models import PlayerIdentity
from apps.gameplay.models import Match
from apps.history.models import ScoreHistoryEntry
from apps.rooms.models import Room, RoomMembership
from apps.rooms.validators import (
    validate_display_name_is_unique_in_room,
    validate_room_is_joinable,
)
from websockets.presence_publisher import publish_room_closed, publish_room_state
from websockets.submission_publisher import publish_submission_receipt


def _serialize_member(membership: RoomMembership) -> dict[str, Any]:
    return {
        "roomMembershipId": str(membership.room_membership_id),
        "membershipStatus": membership.membership_status,
        "joinedAt": membership.joined_at.isoformat(),
        "player": {
            "playerId": str(membership.player.player_id),
            "displayName": membership.player.display_name,
            "identityType": membership.player.identity_type,
        },
    }


def serialize_room(room: Room) -> dict[str, Any]:
    memberships = list(
        room.memberships.select_related("player").exclude(
            membership_status=RoomMembership.MembershipStatus.DISCONNECTED
        )
    )
    return {
        "roomId": str(room.room_id),
        "roomStatus": room.room_status,
        "joinPolicy": room.join_policy,
        "waitingPolicy": room.waiting_policy,
        "hostPlayerId": str(room.host_player_id),
        "hostDisplayName": room.host_player.display_name,
        "members": [_serialize_member(membership) for membership in memberships],
    }


def create_room(player: PlayerIdentity) -> Room:
    room = Room.objects.create(
        host_player=player,
        room_status=Room.RoomStatus.OPEN,
        join_policy=Room.JoinPolicy.OPEN,
        waiting_policy=Room.WaitingPolicy.LATE_JOIN_WAITING_ALLOWED,
    )
    RoomMembership.objects.create(
        room=room,
        player=player,
        membership_status=RoomMembership.MembershipStatus.ACTIVE,
    )
    room.refresh_from_db()
    publish_room_state(room)
    return room


def join_room(player: PlayerIdentity, room_id: str) -> Room:
    room = Room.objects.select_related("host_player").filter(room_id=room_id).first()
    if room is None:
        raise ValueError("Room was not found.")

    validate_room_is_joinable(room)
    validate_display_name_is_unique_in_room(room, player)

    membership = RoomMembership.objects.filter(room=room, player=player).first()
    membership_status = RoomMembership.MembershipStatus.ACTIVE
    if (
        membership is None
        and room.room_status == Room.RoomStatus.ACTIVE_MATCH
        and room.join_policy == Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
    ):
        membership_status = RoomMembership.MembershipStatus.WAITING_FOR_NEXT_GAME
    elif (
        membership is not None
        and membership.membership_status == RoomMembership.MembershipStatus.DISCONNECTED
    ):
        membership_status = RoomMembership.MembershipStatus.ACTIVE

    if membership is None:
        RoomMembership.objects.create(
            room=room,
            player=player,
            membership_status=membership_status,
        )
    else:
        membership.membership_status = membership_status
        membership.save(update_fields=["membership_status"])

    room.refresh_from_db()
    _sync_active_match_after_membership_change(room)
    publish_room_state(room)
    return room


def list_rooms() -> list[dict[str, Any]]:
    rooms = Room.objects.select_related("host_player").exclude(room_status=Room.RoomStatus.CLOSED)
    return [serialize_room(room) for room in rooms]


def get_room_for_player(player: PlayerIdentity) -> Room | None:
    membership = (
        RoomMembership.objects.select_related("room__host_player")
        .filter(player=player)
        .exclude(membership_status=RoomMembership.MembershipStatus.DISCONNECTED)
        .exclude(room__room_status=Room.RoomStatus.CLOSED)
        .order_by("-joined_at")
        .first()
    )
    if membership is None:
        return None
    return membership.room


def _sync_active_match_after_membership_change(room: Room) -> None:
    active_match = room.matches.exclude(match_status=Match.MatchStatus.ENDED).order_by("-created_at").first()
    if active_match is None:
        return

    active_membership_count = room.memberships.filter(
        membership_status=RoomMembership.MembershipStatus.ACTIVE
    ).count()
    if active_match.participant_count != active_membership_count:
        active_match.participant_count = active_membership_count
        active_match.save(update_fields=["participant_count"])

    if active_match.mode == Match.Mode.MULTIPLAYER and active_membership_count < 2:
        from services.match_service import _sync_room_after_match_state
        from websockets.results_publisher import publish_result_publication

        active_match.match_status = Match.MatchStatus.ENDED
        active_match.ended_at = timezone.now()
        active_match.save(update_fields=["match_status", "ended_at"])
        _sync_room_after_match_state(active_match)
        publish_result_publication(active_match)
        return

    if active_match.match_status in [Match.MatchStatus.ACTIVE_ROUND, Match.MatchStatus.SCORING]:
        from engine.round_engine import finalize_round_if_ready
        from services.match_service import _record_history_for_match, _sync_room_after_match_state
        from websockets.results_publisher import (
            publish_result_publication,
            publish_scoring_update,
        )

        finalize_round_if_ready(active_match)
        _record_history_for_match(active_match)
        _sync_room_after_match_state(active_match)
        publish_submission_receipt(active_match)
        if active_match.match_status in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]:
            publish_scoring_update(active_match)
            publish_result_publication(active_match)


def _cleanup_guest_room_history(room: Room) -> None:
    ScoreHistoryEntry.objects.filter(
        room=room,
        player__identity_type=PlayerIdentity.IdentityType.GUEST,
        history_scope=ScoreHistoryEntry.HistoryScope.ROOM_SCOPED,
    ).delete()


def leave_room(player: PlayerIdentity, room_id: str) -> tuple[bool, Room | None]:
    room = Room.objects.select_related("host_player").filter(room_id=room_id).first()
    if room is None:
        raise ValueError("Room was not found.")

    membership = RoomMembership.objects.filter(room=room, player=player).first()
    if membership is None:
        raise ValueError("Player is not a member of this room.")

    is_host = room.host_player_id == player.player_id
    if is_host:
        room.room_status = Room.RoomStatus.CLOSED
        room.join_policy = Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
        room.save(update_fields=["room_status", "join_policy"])
        _cleanup_guest_room_history(room)
        publish_room_closed(room)
        room.memberships.all().delete()
        return True, None

    if room.room_status == Room.RoomStatus.ACTIVE_MATCH:
        membership.membership_status = RoomMembership.MembershipStatus.DISCONNECTED
        membership.save(update_fields=["membership_status"])
    else:
        membership.delete()
    room.refresh_from_db()
    _sync_active_match_after_membership_change(room)
    publish_room_state(room)
    return False, room


def delete_room(player: PlayerIdentity, room_id: str) -> None:
    room = Room.objects.select_related("host_player").filter(room_id=room_id).first()
    if room is None:
        raise ValueError("Room was not found.")
    if room.host_player_id != player.player_id:
        raise ValueError("Only the host can delete this room.")

    room.room_status = Room.RoomStatus.CLOSED
    room.join_policy = Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
    room.save(update_fields=["room_status", "join_policy"])
    _cleanup_guest_room_history(room)
    publish_room_closed(room)
    room.memberships.all().delete()


def mark_player_disconnected(player: PlayerIdentity, room_id: str) -> None:
    room = Room.objects.select_related("host_player").filter(room_id=room_id).first()
    if room is None:
        return

    membership = RoomMembership.objects.filter(
        room=room,
        player=player,
        membership_status=RoomMembership.MembershipStatus.ACTIVE,
    ).first()
    if membership is None:
        return

    membership.membership_status = RoomMembership.MembershipStatus.DISCONNECTED
    membership.save(update_fields=["membership_status"])
    room.refresh_from_db()
    _sync_active_match_after_membership_change(room)
    publish_room_state(room)
