import asyncio
from unittest.mock import patch

from django.test import Client, TransactionTestCase

from services.identity_service import get_active_session
from websockets.messages import room_state_update
from websockets.room_consumer import broker, websocket_application


class WebSocketHarness:
    def __init__(self, path: str, session_cookie: str):
        self.path = path
        self.session_cookie = session_cookie
        self.messages: list[dict] = []
        self._receive_queue: asyncio.Queue[dict] = asyncio.Queue()
        self._task = None

    async def __aenter__(self):
        scope = {
            "type": "websocket",
            "path": self.path,
            "headers": [(b"cookie", f"sessionid={self.session_cookie}".encode("utf-8"))],
        }

        async def receive():
            return await self._receive_queue.get()

        async def send(message):
            self.messages.append(message)

        self._task = asyncio.create_task(websocket_application(scope, receive, send))
        await self._receive_queue.put({"type": "websocket.connect"})
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self._receive_queue.put({"type": "websocket.disconnect"})
        await asyncio.wait_for(self._task, timeout=1)

    async def wait_for_text(self, pattern: str, timeout: float = 1.5) -> dict:
        async def _poll():
            while True:
                for message in self.messages:
                    if message.get("type") != "websocket.send":
                        continue
                    if pattern in message.get("text", ""):
                        return message
                await asyncio.sleep(0.01)

        return await asyncio.wait_for(_poll(), timeout=timeout)


class RealtimeFlowTests(TransactionTestCase):
    def _guest_client(self, display_name: str) -> Client:
        client = Client()
        response = client.post(
            "/sessions/guest/",
            data=f'{{"displayName":"{display_name}"}}',
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        return client

    def test_room_websocket_receives_membership_update(self) -> None:
        host_client = self._guest_client("Host Player")
        create_response = host_client.post("/rooms/create/", content_type="application/json")
        room_id = create_response.json()["room"]["roomId"]
        host_cookie = host_client.cookies["sessionid"].value
        host_player = get_active_session(host_client.session["active_session_id"]).player

        async def scenario():
            async with WebSocketHarness(f"/ws/rooms/{room_id}/", host_cookie) as socket:
                await socket.wait_for_text('"event": "room_state_update"')
                broker.publish(
                    f"room:{room_id}",
                    room_state_update(
                        room_id,
                        {
                            "roomId": room_id,
                            "roomStatus": "open",
                            "hostPlayerId": "player-1",
                            "hostDisplayName": "Host Player",
                            "members": [
                                {
                                    "roomMembershipId": "membership-1",
                                    "membershipStatus": "active",
                                    "joinedAt": "2026-03-31T00:00:00+00:00",
                                    "player": {
                                        "playerId": "player-1",
                                        "displayName": "Host Player",
                                        "identityType": "guest",
                                    },
                                },
                                {
                                    "roomMembershipId": "membership-2",
                                    "membershipStatus": "active",
                                    "joinedAt": "2026-03-31T00:00:00+00:00",
                                    "player": {
                                        "playerId": "player-2",
                                        "displayName": "Guest Player",
                                        "identityType": "guest",
                                    },
                                },
                            ],
                        },
                    ),
                )

                message = await socket.wait_for_text('"displayName": "Guest Player"')
                self.assertIn('"event": "room_state_update"', message["text"])

        with patch("websockets.room_consumer._active_player_from_scope", return_value=host_player):
            asyncio.run(scenario())

    @patch("engine.scoring_engine.random.randint", side_effect=[80, 90, 100])
    def test_match_websocket_receives_result_publication(self, _mock_randint) -> None:
        client = self._guest_client("Realtime Player")
        start_response = client.post(
            "/gameplay/start/",
            data='{"mode":"single_player"}',
            content_type="application/json",
        )
        match_id = start_response.json()["gameplay"]["matchId"]
        client.post(
            "/gameplay/submit/",
            data=f'{{"matchId":"{match_id}","blendedColor":[80,90,100]}}',
            content_type="application/json",
        )
        session_cookie = client.cookies["sessionid"].value
        player = get_active_session(client.session["active_session_id"]).player

        async def scenario():
            async with WebSocketHarness(f"/ws/matches/{match_id}/", session_cookie) as socket:
                result_message = await socket.wait_for_text('"event": "result_publication"')
                self.assertIn('"matchStatus": "results"', result_message["text"])

        with patch("websockets.room_consumer._active_player_from_scope", return_value=player):
            asyncio.run(scenario())
