import pytest

from services.identity_service import create_guest_session
from services.room_service import create_room, join_room, leave_room


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
