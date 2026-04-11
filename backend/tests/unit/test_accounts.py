import pytest

from apps.accounts.models import PlayerIdentity
from services.identity_service import (
    create_guest_session,
    get_active_session,
    logout_session,
    update_guest_display_name,
)
from services.room_service import create_room


@pytest.mark.django_db
def test_create_guest_session_creates_guest_identity_and_session() -> None:
    session = create_guest_session()

    assert session.session_type == "guest"
    assert session.status == "active"
    assert session.player.identity_type == "guest"
    assert session.player.display_name.startswith("Guest ")


@pytest.mark.django_db
def test_update_guest_display_name_changes_identity_name() -> None:
    session = create_guest_session()

    updated_session = update_guest_display_name(session, "Casey")

    assert updated_session.player.display_name == "Casey"


@pytest.mark.django_db
def test_logout_session_marks_session_logged_out() -> None:
    session = create_guest_session("Jordan")

    logout_session(session)

    assert get_active_session(str(session.session_id)) is None


@pytest.mark.django_db
def test_create_guest_session_skips_taken_generated_name() -> None:
    PlayerIdentity.objects.create(
        identity_type=PlayerIdentity.IdentityType.GUEST,
        display_name="Guest 1",
    )
    PlayerIdentity.objects.create(
        identity_type=PlayerIdentity.IdentityType.AUTHENTICATED,
        display_name="Guest 2",
        oauth_identity="taken-guest-2",
    )

    session = create_guest_session()

    assert session.player.display_name == "Guest 3"


@pytest.mark.django_db
def test_update_guest_display_name_validates_uniqueness_in_current_room() -> None:
    host_session = create_guest_session("Host")
    room = create_room(host_session.player)
    guest_session = create_guest_session("Guest")
    room.memberships.create(
        player=guest_session.player,
        membership_status="active",
    )

    with pytest.raises(ValueError, match="Display name is already in use"):
        update_guest_display_name(guest_session, "Host")
