from __future__ import annotations

from apps.accounts.models import PlayerIdentity
from apps.gameplay.models import Match
from websockets.messages import submission_receipt_update, submission_rejection_update
from websockets.room_consumer import broker


def publish_submission_receipt(match: Match) -> None:
    from services.match_service import serialize_match_state

    broker.publish(
        f"match:{match.match_id}",
        submission_receipt_update(serialize_match_state(match)),
    )


def publish_submission_rejection(match_id: str, player: PlayerIdentity, error: str) -> None:
    broker.publish(
        f"match:{match_id}",
        submission_rejection_update(match_id, str(player.player_id), error),
    )
