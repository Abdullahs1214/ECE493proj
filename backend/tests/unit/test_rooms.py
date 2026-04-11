import pytest

from apps.gameplay.models import Match
from apps.rooms.models import Room
from apps.rooms.validators import validate_room_is_joinable
from services.identity_service import create_guest_session
from services.room_service import create_room, delete_room, join_room, leave_room, mark_player_disconnected


@pytest.mark.django_db
def test_create_room_assigns_host_and_membership() -> None:
    session = create_guest_session("Host")

    room = create_room(session.player)

    assert room.host_player == session.player
    assert room.room_status == "open"
    assert room.memberships.count() == 1


@pytest.mark.django_db
def test_join_room_rejects_duplicate_display_name() -> None:
    host_session = create_guest_session("Alex")
    guest_session = create_guest_session("Alex")
    room = create_room(host_session.player)

    with pytest.raises(ValueError, match="Display name is already in use"):
        join_room(guest_session.player, str(room.room_id))


@pytest.mark.django_db
def test_host_leaving_closes_room() -> None:
    host_session = create_guest_session("Host")
    room = create_room(host_session.player)

    room_closed, remaining_room = leave_room(host_session.player, str(room.room_id))

    assert room_closed is True
    assert remaining_room is None


@pytest.mark.django_db
def test_validate_room_is_joinable_rejects_closed_room() -> None:
    host_session = create_guest_session("Host")
    room = create_room(host_session.player)
    room.room_status = Room.RoomStatus.CLOSED

    with pytest.raises(ValueError, match="Room is not open for joining."):
        validate_room_is_joinable(room)


@pytest.mark.django_db
def test_delete_room_rejects_active_match() -> None:
    host_session = create_guest_session("Host")
    guest_session = create_guest_session("Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    room.room_status = Room.RoomStatus.ACTIVE_MATCH
    room.join_policy = Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
    room.save(update_fields=["room_status", "join_policy"])
    Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=2,
    )

    with pytest.raises(ValueError, match="Cannot delete a room during an active match."):
        delete_room(host_session.player, str(room.room_id))


@pytest.mark.django_db
def test_mark_player_disconnected_closes_empty_idle_room() -> None:
    host_session = create_guest_session("Host")
    guest_session = create_guest_session("Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    room.memberships.filter(player=host_session.player).update(membership_status="disconnected")

    mark_player_disconnected(guest_session.player, str(room.room_id))

    room.refresh_from_db()
    assert room.room_status == Room.RoomStatus.CLOSED
    assert room.memberships.count() == 0
