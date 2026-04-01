from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from http.cookies import SimpleCookie
from importlib import import_module
from typing import Any

from asgiref.sync import sync_to_async
from django.conf import settings

from api.views.session_views import SESSION_KEY
from apps.rooms.models import RoomMembership
from services.identity_service import get_active_session
from websockets.messages import (
    connection_ready,
    match_start_update,
    result_publication,
    room_state_update,
    round_start_update,
    timer_update,
)
from websockets.routing import resolve_websocket_route


class RealtimeBroker:
    def __init__(self) -> None:
        self._topics: dict[str, set[asyncio.Queue[dict[str, Any]]]] = defaultdict(set)

    def subscribe(self, topic: str) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self._topics[topic].add(queue)
        return queue

    def unsubscribe(self, topic: str, queue: asyncio.Queue[dict[str, Any]]) -> None:
        subscribers = self._topics.get(topic)
        if not subscribers:
            return
        subscribers.discard(queue)
        if not subscribers:
            self._topics.pop(topic, None)

    def publish(self, topic: str, payload: dict[str, Any]) -> None:
        for queue in list(self._topics.get(topic, set())):
            queue.put_nowait(payload)


broker = RealtimeBroker()


def _session_store():
    engine = import_module(settings.SESSION_ENGINE)
    return engine.SessionStore


def _cookie_value(scope: dict[str, Any], key: str) -> str | None:
    for header_name, header_value in scope.get("headers", []):
        if header_name == b"cookie":
            cookie = SimpleCookie()
            cookie.load(header_value.decode("utf-8"))
            morsel = cookie.get(key)
            if morsel is not None:
                return morsel.value
    return None


def _active_player_from_scope(scope: dict[str, Any]):
    session_key = _cookie_value(scope, settings.SESSION_COOKIE_NAME)
    if not session_key:
        return None

    store = _session_store()(session_key=session_key)
    active_session_id = store.get(SESSION_KEY)
    if not active_session_id:
        return None

    active_session = get_active_session(active_session_id)
    if active_session is None:
        return None
    return active_session.player


async def _send_json(send, payload: dict[str, Any]) -> None:
    await send({"type": "websocket.send", "text": json.dumps(payload)})


async def _forward_broker_messages(send, queue: asyncio.Queue[dict[str, Any]]) -> None:
    while True:
        payload = await queue.get()
        await _send_json(send, payload)


async def _forward_timer_updates(send, player, match_id: str) -> None:
    from services.match_service import get_match_state, serialize_match_state

    while True:
        await asyncio.sleep(1)
        try:
            match = await sync_to_async(get_match_state)(player, match_id)
        except ValueError:
            return

        gameplay = await sync_to_async(serialize_match_state)(match)
        if gameplay["matchStatus"] not in ["active_round", "scoring"]:
            return
        await _send_json(send, timer_update(gameplay))


async def _receive_until_disconnect(receive) -> None:
    while True:
        message = await receive()
        if message["type"] == "websocket.disconnect":
            return


async def _handle_room_socket(scope, receive, send, player, room_id: str) -> None:
    from services.room_service import serialize_room

    membership = await sync_to_async(
        lambda: (
            RoomMembership.objects.select_related("room__host_player")
            .filter(
                room_id=room_id,
                player=player,
                membership_status=RoomMembership.MembershipStatus.ACTIVE,
            )
            .first()
        )
    )()
    if membership is None:
        await send({"type": "websocket.close", "code": 4403})
        return

    room = membership.room
    await send({"type": "websocket.accept"})
    await _send_json(send, connection_ready("room", room_id))
    await _send_json(
        send,
        room_state_update(room_id, await sync_to_async(serialize_room)(room)),
    )

    active_match = await sync_to_async(
        lambda: room.matches.exclude(match_status="ended").order_by("-created_at").first()
    )()
    if active_match is not None:
        await _send_json(send, match_start_update(str(active_match.match_id), room_id))

    topic = f"room:{room_id}"
    queue = broker.subscribe(topic)
    forward_task = asyncio.create_task(_forward_broker_messages(send, queue))
    try:
        await _receive_until_disconnect(receive)
    finally:
        forward_task.cancel()
        broker.unsubscribe(topic, queue)


async def _initial_match_messages(send, player, match_id: str) -> None:
    from services.match_service import get_match_state, serialize_match_state

    match = await sync_to_async(get_match_state)(player, match_id)
    gameplay = await sync_to_async(serialize_match_state)(match)
    if gameplay["matchStatus"] in ["results", "ended"]:
        await _send_json(send, result_publication(gameplay))
        await _send_json(send, {"event": "social_interaction_update", "matchId": match_id})
        return

    await _send_json(send, round_start_update(gameplay))
    await _send_json(send, timer_update(gameplay))


async def _handle_match_socket(scope, receive, send, player, match_id: str) -> None:
    from services.match_service import get_match_state
    from services.social_service import get_social_state

    try:
        match = await sync_to_async(get_match_state)(player, match_id)
    except ValueError:
        await send({"type": "websocket.close", "code": 4403})
        return

    await send({"type": "websocket.accept"})
    await _send_json(send, connection_ready("match", match_id))
    await _initial_match_messages(send, player, match_id)
    if match.match_status in ["results", "ended"]:
        try:
            social = await sync_to_async(get_social_state)(player, match_id)
        except ValueError:
            social = None
        if social is not None:
            await _send_json(send, {"event": "social_interaction_update", "matchId": match_id})

    topic = f"match:{match_id}"
    queue = broker.subscribe(topic)
    forward_task = asyncio.create_task(_forward_broker_messages(send, queue))
    timer_task = asyncio.create_task(_forward_timer_updates(send, player, match_id))
    try:
        await _receive_until_disconnect(receive)
    finally:
        forward_task.cancel()
        timer_task.cancel()
        broker.unsubscribe(topic, queue)


async def websocket_application(scope, receive, send) -> None:
    route_name, topic_id = resolve_websocket_route(scope.get("path", ""))
    if route_name is None or topic_id is None:
        await send({"type": "websocket.close", "code": 4404})
        return

    player = await sync_to_async(_active_player_from_scope)(scope)
    if player is None:
        await send({"type": "websocket.close", "code": 4401})
        return

    if route_name == "room":
        await _handle_room_socket(scope, receive, send, player, topic_id)
        return

    await _handle_match_socket(scope, receive, send, player, topic_id)
