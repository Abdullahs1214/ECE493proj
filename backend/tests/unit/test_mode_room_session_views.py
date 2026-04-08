import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory

from api.views import room_views, session_views
from services.identity_service import create_guest_session
from services.mode_service import start_gameplay_for_mode
from services.room_service import join_room, leave_room


def _request_with_session(request):
    middleware = SessionMiddleware(lambda req: None)
    middleware.process_request(request)
    request.session.save()
    return request


def _json(response):
    return json.loads(response.content.decode("utf-8"))


@pytest.mark.django_db
def test_start_gameplay_for_single_player_publishes_match_start() -> None:
    player = create_guest_session("Solo").player
    match = SimpleNamespace(match_id="match-1")

    with (
        patch("services.mode_service.start_single_player_match", return_value=match) as mock_start,
        patch("services.mode_service.publish_match_start") as mock_publish,
    ):
        resolved = start_gameplay_for_mode(player, "single_player")

    assert resolved is match
    mock_start.assert_called_once_with(player)
    mock_publish.assert_called_once_with(match)


@pytest.mark.django_db
def test_start_gameplay_for_multiplayer_requires_room_id() -> None:
    player = create_guest_session("Player").player

    with pytest.raises(ValueError, match="roomId is required for multiplayer mode."):
        start_gameplay_for_mode(player, "multiplayer")


@pytest.mark.django_db
def test_start_gameplay_for_multiplayer_publishes_match_start() -> None:
    player = create_guest_session("Player").player
    match = SimpleNamespace(match_id="match-2")

    with (
        patch("services.mode_service.start_multiplayer_match", return_value=match) as mock_start,
        patch("services.mode_service.publish_match_start") as mock_publish,
    ):
        resolved = start_gameplay_for_mode(player, "multiplayer", "room-1")

    assert resolved is match
    mock_start.assert_called_once_with(player, "room-1")
    mock_publish.assert_called_once_with(match)


@pytest.mark.django_db
def test_start_gameplay_for_mode_rejects_unsupported_mode() -> None:
    player = create_guest_session("Player").player

    with pytest.raises(ValueError, match="Unsupported mode."):
        start_gameplay_for_mode(player, "coop")


@pytest.mark.django_db
def test_join_room_raises_for_missing_room() -> None:
    player = create_guest_session("Player").player

    with pytest.raises(ValueError, match="Room was not found."):
        join_room(player, "00000000-0000-0000-0000-000000000001")


@pytest.mark.django_db
def test_join_room_reactivates_existing_membership() -> None:
    host = create_guest_session("Host").player
    guest = create_guest_session("Guest").player

    with patch("services.room_service.publish_room_state"):
        room = room_views.create_room(host)
        join_room(guest, str(room.room_id))

    membership = room.memberships.get(player=guest)
    membership.membership_status = "disconnected"
    membership.save(update_fields=["membership_status"])

    with patch("services.room_service.publish_room_state") as mock_publish:
        resolved_room = join_room(guest, str(room.room_id))

    membership.refresh_from_db()
    assert resolved_room.room_id == room.room_id
    assert membership.membership_status == "active"
    mock_publish.assert_called_once_with(resolved_room)


@pytest.mark.django_db
def test_leave_room_raises_for_missing_room() -> None:
    player = create_guest_session("Player").player

    with pytest.raises(ValueError, match="Room was not found."):
        leave_room(player, "00000000-0000-0000-0000-000000000001")


@pytest.mark.django_db
def test_leave_room_raises_for_non_member() -> None:
    host = create_guest_session("Host").player
    outsider = create_guest_session("Outsider").player

    with patch("services.room_service.publish_room_state"):
        room = room_views.create_room(host)

    with pytest.raises(ValueError, match="Player is not a member of this room."):
        leave_room(outsider, str(room.room_id))


@pytest.mark.django_db
def test_room_view_helpers_handle_empty_invalid_and_non_dict_payloads() -> None:
    request = RequestFactory().post("/rooms/join/", data="", content_type="application/json")
    assert room_views._load_request_data(request) == {}

    invalid_request = RequestFactory().post(
        "/rooms/join/",
        data="{invalid",
        content_type="application/json",
    )
    assert room_views._load_request_data(invalid_request) == {}

    list_request = RequestFactory().post(
        "/rooms/join/",
        data='["room-1"]',
        content_type="application/json",
    )
    assert room_views._load_request_data(list_request) == {}


@pytest.mark.django_db
def test_create_room_view_requires_active_session() -> None:
    request = _request_with_session(RequestFactory().post("/rooms/create/"))

    response = room_views.create_room_view(request)

    assert response.status_code == 401
    assert _json(response) == {"error": "No active session."}


@pytest.mark.django_db
def test_join_room_view_handles_missing_room_id_and_service_errors() -> None:
    player = create_guest_session("Player").player

    missing_id_request = _request_with_session(
        RequestFactory().post("/rooms/join/", data="{}", content_type="application/json")
    )
    with patch("api.views.room_views.get_active_session", return_value=SimpleNamespace(player=player)):
        missing_id_response = room_views.join_room_view(missing_id_request)
    assert missing_id_response.status_code == 400
    assert _json(missing_id_response) == {"error": "roomId is required."}

    error_request = _request_with_session(
        RequestFactory().post(
            "/rooms/join/",
            data='{"roomId":"room-1"}',
            content_type="application/json",
        )
    )
    with (
        patch("api.views.room_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch("api.views.room_views.join_room", side_effect=ValueError("Room was not found.")),
    ):
        error_response = room_views.join_room_view(error_request)
    assert error_response.status_code == 400
    assert _json(error_response) == {"error": "Room was not found."}


@pytest.mark.django_db
def test_join_room_view_requires_active_session() -> None:
    request = _request_with_session(RequestFactory().post("/rooms/join/"))

    response = room_views.join_room_view(request)

    assert response.status_code == 401
    assert _json(response) == {"error": "No active session."}


@pytest.mark.django_db
def test_leave_room_view_handles_no_session_missing_room_id_and_service_errors() -> None:
    no_session_request = _request_with_session(RequestFactory().post("/rooms/leave/"))
    no_session_response = room_views.leave_room_view(no_session_request)
    assert no_session_response.status_code == 401
    assert _json(no_session_response) == {"error": "No active session."}

    player = create_guest_session("Player").player
    missing_id_request = _request_with_session(
        RequestFactory().post("/rooms/leave/", data="[]", content_type="application/json")
    )
    with patch("api.views.room_views.get_active_session", return_value=SimpleNamespace(player=player)):
        missing_id_response = room_views.leave_room_view(missing_id_request)
    assert missing_id_response.status_code == 400
    assert _json(missing_id_response) == {"error": "roomId is required."}

    error_request = _request_with_session(
        RequestFactory().post(
            "/rooms/leave/",
            data='{"roomId":"room-1"}',
            content_type="application/json",
        )
    )
    with (
        patch("api.views.room_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch("api.views.room_views.leave_room", side_effect=ValueError("Player is not a member of this room.")),
    ):
        error_response = room_views.leave_room_view(error_request)
    assert error_response.status_code == 400
    assert _json(error_response) == {"error": "Player is not a member of this room."}


def test_session_view_load_request_data_handles_empty_invalid_and_non_dict_payloads() -> None:
    empty_request = RequestFactory().post("/sessions/guest/", data="", content_type="application/json")
    assert session_views._load_request_data(empty_request) == {}

    invalid_request = RequestFactory().post(
        "/sessions/guest/",
        data="{invalid",
        content_type="application/json",
    )
    assert session_views._load_request_data(invalid_request) == {}

    list_request = RequestFactory().post(
        "/sessions/guest/",
        data='["Guest"]',
        content_type="application/json",
    )
    assert session_views._load_request_data(list_request) == {}


@pytest.mark.django_db
def test_guest_entry_view_uses_none_display_name_when_payload_is_not_a_dict() -> None:
    request = _request_with_session(
        RequestFactory().post("/sessions/guest/", data='["Guest"]', content_type="application/json")
    )
    session = SimpleNamespace(session_id="session-1")

    with (
        patch("api.views.session_views.create_guest_session", return_value=session) as mock_create,
        patch("api.views.session_views.serialize_session", return_value={"sessionId": "session-1"}),
    ):
        response = session_views.guest_entry_view(request)

    assert response.status_code == 201
    assert _json(response) == {"session": {"sessionId": "session-1"}}
    assert request.session[session_views.SESSION_KEY] == "session-1"
    mock_create.assert_called_once_with(None)


@pytest.mark.django_db
def test_current_and_update_session_views_require_active_session() -> None:
    current_request = _request_with_session(RequestFactory().get("/sessions/current/"))
    current_response = session_views.current_session_view(current_request)
    assert current_response.status_code == 401
    assert _json(current_response) == {"error": "No active session."}

    update_request = _request_with_session(
        RequestFactory().patch(
            "/sessions/current/update/",
            data='{"displayName":"Casey"}',
            content_type="application/json",
        )
    )
    update_response = session_views.update_session_view(update_request)
    assert update_response.status_code == 401
    assert _json(update_response) == {"error": "No active session."}


@pytest.mark.django_db
def test_update_session_view_requires_non_blank_display_name() -> None:
    session = create_guest_session("Player")
    request = _request_with_session(
        RequestFactory().patch(
            "/sessions/current/update/",
            data='{"displayName":"   "}',
            content_type="application/json",
        )
    )
    request.session[session_views.SESSION_KEY] = str(session.session_id)

    response = session_views.update_session_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "displayName is required."}


@pytest.mark.django_db
def test_logout_view_succeeds_without_active_session() -> None:
    request = _request_with_session(RequestFactory().post("/sessions/logout/"))

    with patch("api.views.session_views.logout_session") as mock_logout:
        response = session_views.logout_view(request)

    assert response.status_code == 200
    assert _json(response) == {"loggedOut": True}
    mock_logout.assert_not_called()
