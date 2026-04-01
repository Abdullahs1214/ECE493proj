from __future__ import annotations

import re


ROOM_PATH_PATTERN = re.compile(r"^/ws/rooms/(?P<room_id>[^/]+)/$")
MATCH_PATH_PATTERN = re.compile(r"^/ws/matches/(?P<match_id>[^/]+)/$")


def resolve_websocket_route(path: str) -> tuple[str | None, str | None]:
    room_match = ROOM_PATH_PATTERN.match(path)
    if room_match is not None:
        return "room", room_match.group("room_id")

    match_match = MATCH_PATH_PATTERN.match(path)
    if match_match is not None:
        return "match", match_match.group("match_id")

    return None, None
