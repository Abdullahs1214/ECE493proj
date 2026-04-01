import pytest

from services.identity_service import (
    create_guest_session,
    get_active_session,
    logout_session,
    update_guest_display_name,
)


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
