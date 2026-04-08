import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from apps.gameplay.models import Match
from services.identity_service import create_guest_session
from services.room_service import create_room
from websockets.match_publisher import publish_match_start, publish_round_start
from websockets.messages import timer_update
from websockets.room_consumer import (
    RealtimeBroker,
    _active_player_from_scope,
    _cookie_value,
    _forward_timer_updates,
    _handle_match_socket,
    _handle_room_socket,
    _initial_match_messages,
    _session_store,
    websocket_application,
)
from websockets.routing import resolve_websocket_route
from websockets.submission_publisher import (
    publish_submission_receipt,
    publish_submission_rejection,
)


def _send_collector(messages: list[dict]):
    async def send(message: dict):
        messages.append(message)

    return send


def _disconnect_receive():
    queue: asyncio.Queue[dict] = asyncio.Queue()
    queue.put_nowait({"type": "websocket.disconnect"})

    async def receive():
        return await queue.get()

    return receive


def _immediate_sync_to_async(func):
    async def wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    return wrapper


def test_resolve_websocket_route_returns_none_for_unknown_path() -> None:
    assert resolve_websocket_route("/ws/unknown/123/") == (None, None)


def test_realtime_broker_unsubscribe_removes_last_subscriber() -> None:
    broker = RealtimeBroker()
    queue = broker.subscribe("topic-1")

    broker.unsubscribe("topic-1", queue)

    assert "topic-1" not in broker._topics


def test_realtime_broker_unsubscribe_ignores_missing_topic() -> None:
    broker = RealtimeBroker()

    broker.unsubscribe("missing", asyncio.Queue())

    assert broker._topics == {}


def test_realtime_broker_unsubscribe_keeps_topic_when_other_subscribers_remain() -> None:
    broker = RealtimeBroker()
    queue_one = broker.subscribe("topic-1")
    queue_two = broker.subscribe("topic-1")

    broker.unsubscribe("topic-1", queue_one)

    assert broker._topics["topic-1"] == {queue_two}


def test_session_store_uses_configured_session_engine() -> None:
    fake_store = object()
    fake_module = SimpleNamespace(SessionStore=fake_store)

    with patch("websockets.room_consumer.import_module", return_value=fake_module) as mock_import:
        resolved = _session_store()

    assert resolved is fake_store
    mock_import.assert_called_once()


def test_cookie_value_returns_matching_cookie() -> None:
    scope = {"headers": [(b"cookie", b"sessionid=abc123; csrftoken=def456")]}

    assert _cookie_value(scope, "sessionid") == "abc123"


def test_cookie_value_returns_none_without_match() -> None:
    scope = {"headers": [(b"x-test", b"value")]}

    assert _cookie_value(scope, "sessionid") is None


def test_cookie_value_checks_later_cookie_headers_when_first_cookie_does_not_match() -> None:
    scope = {
        "headers": [
            (b"cookie", b"csrftoken=def456"),
            (b"cookie", b"sessionid=abc123"),
        ]
    }

    assert _cookie_value(scope, "sessionid") == "abc123"


def test_active_player_from_scope_returns_none_without_cookie() -> None:
    assert _active_player_from_scope({"headers": []}) is None


def test_active_player_from_scope_returns_none_without_active_session_id() -> None:
    fake_store = SimpleNamespace(get=lambda key: None)

    with (
        patch("websockets.room_consumer._cookie_value", return_value="cookie-1"),
        patch("websockets.room_consumer._session_store", return_value=lambda session_key: fake_store),
    ):
        assert _active_player_from_scope({"headers": [(b"cookie", b"sessionid=cookie-1")]}) is None


def test_active_player_from_scope_returns_none_without_active_session() -> None:
    fake_store = SimpleNamespace(get=lambda key: "session-1")

    with (
        patch("websockets.room_consumer._cookie_value", return_value="cookie-1"),
        patch("websockets.room_consumer._session_store", return_value=lambda session_key: fake_store),
        patch("websockets.room_consumer.get_active_session", return_value=None),
    ):
        assert _active_player_from_scope({"headers": [(b"cookie", b"sessionid=cookie-1")]}) is None


def test_active_player_from_scope_returns_player_when_session_is_active() -> None:
    player = SimpleNamespace(player_id="player-1")
    fake_store = SimpleNamespace(get=lambda key: "session-1")
    active_session = SimpleNamespace(player=player)

    with (
        patch("websockets.room_consumer._cookie_value", return_value="cookie-1"),
        patch("websockets.room_consumer._session_store", return_value=lambda session_key: fake_store),
        patch("websockets.room_consumer.get_active_session", return_value=active_session),
    ):
        resolved = _active_player_from_scope({"headers": [(b"cookie", b"sessionid=cookie-1")]})

    assert resolved is player


def test_timer_update_serializes_gameplay_payload() -> None:
    payload = timer_update({"matchId": "match-1", "matchStatus": "active_round"})

    assert payload["event"] == "timer_update"
    assert payload["matchId"] == "match-1"


@pytest.mark.django_db
def test_publish_match_start_publishes_to_match_and_room_topics() -> None:
    player = create_guest_session("Host").player
    room = create_room(player)
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )

    with (
        patch("websockets.match_publisher.serialize_match_state", return_value={"matchId": str(match.match_id)}),
        patch("websockets.match_publisher.broker.publish") as mock_publish,
    ):
        publish_match_start(match)

    assert mock_publish.call_count == 2


@pytest.mark.django_db
def test_publish_round_start_publishes_to_match_topic() -> None:
    player = create_guest_session("Solo").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )

    with (
        patch("websockets.match_publisher.serialize_match_state", return_value={"matchId": str(match.match_id)}),
        patch("websockets.match_publisher.broker.publish") as mock_publish,
    ):
        publish_round_start(match)

    mock_publish.assert_called_once()


@pytest.mark.django_db
def test_publish_submission_receipt_publishes_serialized_match_state() -> None:
    player = create_guest_session("Solo").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )

    with (
        patch("services.match_service.serialize_match_state", return_value={"matchId": str(match.match_id)}),
        patch("websockets.submission_publisher.broker.publish") as mock_publish,
    ):
        publish_submission_receipt(match)

    mock_publish.assert_called_once()


@pytest.mark.django_db
def test_publish_submission_rejection_publishes_player_specific_error() -> None:
    player = create_guest_session("Solo").player

    with patch("websockets.submission_publisher.broker.publish") as mock_publish:
        publish_submission_rejection("match-1", player, "Too late.")

    mock_publish.assert_called_once()


def test_forward_timer_updates_returns_when_match_lookup_fails() -> None:
    messages: list[dict] = []

    async def run_test():
        with (
            patch("websockets.room_consumer.asyncio.sleep", new=AsyncMock(return_value=None)),
            patch("services.match_service.get_match_state", side_effect=ValueError("missing")),
        ):
            await _forward_timer_updates(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    assert messages == []


def test_forward_timer_updates_sends_active_round_update_then_stops() -> None:
    messages: list[dict] = []

    async def run_test():
        with (
            patch("websockets.room_consumer.asyncio.sleep", new=AsyncMock(return_value=None)),
            patch(
                "services.match_service.get_match_state",
                side_effect=[SimpleNamespace(), ValueError("done")],
            ),
            patch(
                "services.match_service.serialize_match_state",
                return_value={"matchId": "match-1", "matchStatus": "active_round"},
            ),
        ):
            await _forward_timer_updates(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    payload = json.loads(messages[0]["text"])
    assert payload["event"] == "timer_update"


def test_forward_timer_updates_stops_when_match_is_no_longer_active() -> None:
    messages: list[dict] = []

    async def run_test():
        with (
            patch("websockets.room_consumer.asyncio.sleep", new=AsyncMock(return_value=None)),
            patch("services.match_service.get_match_state", return_value=SimpleNamespace()),
            patch(
                "services.match_service.serialize_match_state",
                return_value={"matchId": "match-1", "matchStatus": "results"},
            ),
        ):
            await _forward_timer_updates(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    assert messages == []


def test_handle_room_socket_closes_when_membership_is_missing() -> None:
    player = SimpleNamespace(player_id="player-1")
    messages: list[dict] = []
    fake_manager = SimpleNamespace(
        select_related=lambda *args, **kwargs: SimpleNamespace(
            filter=lambda **filter_kwargs: SimpleNamespace(first=lambda: None)
        )
    )

    async def run_test():
        with (
            patch("websockets.room_consumer.sync_to_async", side_effect=_immediate_sync_to_async),
            patch("websockets.room_consumer.RoomMembership.objects", fake_manager),
        ):
            await _handle_room_socket(
                {"path": "/ws/rooms/room-1/"},
                _disconnect_receive(),
                _send_collector(messages),
                player,
                "00000000-0000-0000-0000-000000000001",
            )

    asyncio.run(run_test())

    assert messages == [{"type": "websocket.close", "code": 4403}]


def test_handle_room_socket_sends_match_start_when_room_has_active_match() -> None:
    player = SimpleNamespace(player_id="player-1")
    match = SimpleNamespace(match_id="match-1")
    room = SimpleNamespace(
        room_id="room-1",
        matches=SimpleNamespace(
            exclude=lambda **kwargs: SimpleNamespace(
                order_by=lambda *args, **inner_kwargs: SimpleNamespace(first=lambda: match)
            )
        ),
    )
    membership = SimpleNamespace(room=room)
    fake_manager = SimpleNamespace(
        select_related=lambda *args, **kwargs: SimpleNamespace(
            filter=lambda **filter_kwargs: SimpleNamespace(first=lambda: membership)
        )
    )
    messages: list[dict] = []

    async def run_test():
        with (
            patch("websockets.room_consumer.sync_to_async", side_effect=_immediate_sync_to_async),
            patch("websockets.room_consumer.RoomMembership.objects", fake_manager),
            patch(
                "services.room_service.serialize_room",
                return_value={"roomId": str(room.room_id), "members": []},
            ),
        ):
            await _handle_room_socket(
                {"path": f"/ws/rooms/{room.room_id}/"},
                _disconnect_receive(),
                _send_collector(messages),
                player,
                str(room.room_id),
            )

    asyncio.run(run_test())

    assert messages[0] == {"type": "websocket.accept"}
    assert any(str(match.match_id) in message.get("text", "") for message in messages)


def test_initial_match_messages_sends_round_and_timer_for_active_match() -> None:
    messages: list[dict] = []

    async def run_test():
        with (
            patch("services.match_service.get_match_state", return_value=SimpleNamespace()),
            patch(
                "services.match_service.serialize_match_state",
                return_value={"matchId": "match-1", "matchStatus": "active_round"},
            ),
        ):
            await _initial_match_messages(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    assert len(messages) == 2
    assert '"event": "round_start_update"' in messages[0]["text"]
    assert '"event": "timer_update"' in messages[1]["text"]


def test_handle_match_socket_closes_when_match_lookup_fails() -> None:
    messages: list[dict] = []

    async def run_test():
        with patch("services.match_service.get_match_state", side_effect=ValueError("missing")):
            await _handle_match_socket(
                {"path": "/ws/matches/match-1/"},
                _disconnect_receive(),
                _send_collector(messages),
                SimpleNamespace(),
                "match-1",
            )

    asyncio.run(run_test())

    assert messages == [{"type": "websocket.close", "code": 4403}]


def test_handle_match_socket_skips_social_lookup_for_non_result_match() -> None:
    messages: list[dict] = []
    match = SimpleNamespace(match_status="active_round")

    async def run_test():
        with (
            patch("services.match_service.get_match_state", return_value=match),
            patch("websockets.room_consumer._initial_match_messages", new=AsyncMock()),
            patch("websockets.room_consumer._forward_broker_messages", new=AsyncMock()),
            patch("websockets.room_consumer._forward_timer_updates", new=AsyncMock()),
            patch("services.social_service.get_social_state") as mock_social,
        ):
            await _handle_match_socket(
                {"path": "/ws/matches/match-1/"},
                _disconnect_receive(),
                _send_collector(messages),
                SimpleNamespace(),
                "match-1",
            )
        mock_social.assert_not_called()

    asyncio.run(run_test())

    assert messages[0] == {"type": "websocket.accept"}


def test_handle_match_socket_ignores_social_lookup_errors_for_results_match() -> None:
    messages: list[dict] = []
    match = SimpleNamespace(match_status="results")

    async def run_test():
        with (
            patch("services.match_service.get_match_state", return_value=match),
            patch("services.social_service.get_social_state", side_effect=ValueError("missing")),
            patch("websockets.room_consumer._initial_match_messages", new=AsyncMock()),
            patch("websockets.room_consumer._forward_broker_messages", new=AsyncMock()),
            patch("websockets.room_consumer._forward_timer_updates", new=AsyncMock()),
        ):
            await _handle_match_socket(
                {"path": "/ws/matches/match-1/"},
                _disconnect_receive(),
                _send_collector(messages),
                SimpleNamespace(),
                "match-1",
            )

    asyncio.run(run_test())

    assert not any('"social_interaction_update"' in message.get("text", "") for message in messages)


def test_websocket_application_closes_for_unknown_route() -> None:
    messages: list[dict] = []

    async def receive():
        return {"type": "websocket.connect"}

    asyncio.run(
        websocket_application(
            {"path": "/ws/invalid/"},
            receive,
            _send_collector(messages),
        )
    )

    assert messages == [{"type": "websocket.close", "code": 4404}]


def test_websocket_application_closes_when_player_is_missing() -> None:
    messages: list[dict] = []

    async def receive():
        return {"type": "websocket.connect"}

    async def run_test():
        with patch("websockets.room_consumer._active_player_from_scope", return_value=None):
            await websocket_application(
                {"path": "/ws/rooms/room-1/"},
                receive,
                _send_collector(messages),
            )

    asyncio.run(run_test())

    assert messages == [{"type": "websocket.close", "code": 4401}]
