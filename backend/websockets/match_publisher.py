from __future__ import annotations

from apps.gameplay.models import Match
from services.match_service import serialize_match_state
from websockets.messages import match_start_update, round_start_update
from websockets.room_consumer import broker


def publish_match_start(match: Match) -> None:
    broker.publish(
        f"match:{match.match_id}",
        round_start_update(serialize_match_state(match)),
    )
    if match.room_id:
        broker.publish(
            f"room:{match.room_id}",
            match_start_update(str(match.match_id), str(match.room_id)),
        )


def publish_round_start(match: Match) -> None:
    broker.publish(
        f"match:{match.match_id}",
        round_start_update(serialize_match_state(match)),
    )
