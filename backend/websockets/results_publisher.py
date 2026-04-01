from __future__ import annotations

from apps.gameplay.models import Match
from websockets.messages import result_publication, scoring_update, social_interaction_update
from websockets.room_consumer import broker


def publish_scoring_update(match: Match) -> None:
    from services.match_service import serialize_match_state

    broker.publish(
        f"match:{match.match_id}",
        scoring_update(serialize_match_state(match)),
    )


def publish_result_publication(match: Match) -> None:
    from services.match_service import serialize_match_state

    broker.publish(
        f"match:{match.match_id}",
        result_publication(serialize_match_state(match)),
    )


def publish_social_interaction(match_id: str) -> None:
    broker.publish(f"match:{match_id}", social_interaction_update(match_id))
