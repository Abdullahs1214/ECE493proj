from __future__ import annotations

from typing import Any

from apps.accounts.models import PlayerIdentity
from apps.rooms.models import Room, RoomMembership
from apps.rooms.validators import (
    validate_display_name_is_unique_in_room,
    validate_room_is_joinable,
)
from websockets.presence_publisher import publish_room_closed, publish_room_state


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
        room.memberships.select_related("player").filter(
            membership_status=RoomMembership.MembershipStatus.ACTIVE
        )
    )
    return {
        "roomId": str(room.room_id),
        "roomStatus": room.room_status,
        "hostPlayerId": str(room.host_player_id),
        "hostDisplayName": room.host_player.display_name,
        "members": [_serialize_member(membership) for membership in memberships],
    }


def create_room(player: PlayerIdentity) -> Room:
    room = Room.objects.create(host_player=player, room_status=Room.RoomStatus.OPEN)
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
    if membership is None:
        RoomMembership.objects.create(
            room=room,
            player=player,
            membership_status=RoomMembership.MembershipStatus.ACTIVE,
        )
    else:
        membership.membership_status = RoomMembership.MembershipStatus.ACTIVE
        membership.save(update_fields=["membership_status"])

    room.refresh_from_db()
    publish_room_state(room)
    return room


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
        room.save(update_fields=["room_status"])
        publish_room_closed(room)
        room.memberships.all().delete()
        return True, None

    membership.delete()
    room.refresh_from_db()
    publish_room_state(room)
    return False, room
