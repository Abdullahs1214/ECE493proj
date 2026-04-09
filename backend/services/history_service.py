from __future__ import annotations

from typing import Any

from apps.accounts.models import PlayerIdentity
from apps.history.models import ScoreHistoryEntry


def record_score_history(score_record) -> None:
    round_instance = score_record.round
    room = round_instance.match.room
    player = score_record.player

    ScoreHistoryEntry.objects.get_or_create(
        round=round_instance,
        player=player,
        score_record=score_record,
        history_scope=ScoreHistoryEntry.HistoryScope.ROOM_SCOPED,
        defaults={"room": room},
    )

    if player.identity_type == PlayerIdentity.IdentityType.AUTHENTICATED:
        ScoreHistoryEntry.objects.get_or_create(
            round=round_instance,
            player=player,
            score_record=score_record,
            history_scope=ScoreHistoryEntry.HistoryScope.IDENTITY_SCOPED,
            defaults={"room": room},
        )


def _serialize_history_entry(entry: ScoreHistoryEntry) -> dict[str, Any]:
    return {
        "scoreHistoryEntryId": str(entry.score_history_entry_id),
        "historyScope": entry.history_scope,
        "roomId": str(entry.room_id) if entry.room_id else None,
        "roundId": str(entry.round_id),
        "scoreRecordId": str(entry.score_record_id),
        "displayName": entry.player.display_name,
        "score": entry.score_record.score,
        "similarityPercentage": entry.score_record.similarity_percentage,
        "rank": entry.score_record.rank,
    }


def get_history_for_player(player: PlayerIdentity) -> dict[str, list[dict[str, Any]]]:
    room_entries = (
        ScoreHistoryEntry.objects.select_related("score_record", "player")
        .filter(
            player=player,
            history_scope=ScoreHistoryEntry.HistoryScope.ROOM_SCOPED,
        )
        .order_by("-created_at")
    )
    identity_entries = (
        ScoreHistoryEntry.objects.select_related("score_record", "player")
        .filter(player=player, history_scope=ScoreHistoryEntry.HistoryScope.IDENTITY_SCOPED)
        .order_by("-created_at")
    )
    return {
        "roomScopedHistory": [_serialize_history_entry(entry) for entry in room_entries],
        "identityScopedHistory": [_serialize_history_entry(entry) for entry in identity_entries],
    }
