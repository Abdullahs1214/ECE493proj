from __future__ import annotations

from typing import Any


def connection_ready(scope_name: str, topic_id: str) -> dict[str, Any]:
    return {
        "event": "connection_ready",
        "scope": scope_name,
        "topicId": topic_id,
    }


def room_state_update(
    room_id: str,
    room: dict[str, Any] | None,
    *,
    room_closed: bool = False,
) -> dict[str, Any]:
    return {
        "event": "room_state_update",
        "roomId": room_id,
        "roomClosed": room_closed,
        "room": room,
    }


def match_start_update(match_id: str, room_id: str | None) -> dict[str, Any]:
    return {
        "event": "match_start_update",
        "matchId": match_id,
        "roomId": room_id,
    }


def round_start_update(gameplay: dict[str, Any]) -> dict[str, Any]:
    return {
        "event": "round_start_update",
        "matchId": gameplay["matchId"],
        "gameplay": gameplay,
    }


def timer_update(gameplay: dict[str, Any]) -> dict[str, Any]:
    return {
        "event": "timer_update",
        "matchId": gameplay["matchId"],
        "gameplay": gameplay,
    }


def submission_receipt_update(gameplay: dict[str, Any]) -> dict[str, Any]:
    return {
        "event": "submission_receipt_update",
        "matchId": gameplay["matchId"],
        "gameplay": gameplay,
    }


def submission_rejection_update(
    match_id: str,
    player_id: str,
    error: str,
) -> dict[str, Any]:
    return {
        "event": "submission_rejection_update",
        "matchId": match_id,
        "playerId": player_id,
        "error": error,
    }


def scoring_update(gameplay: dict[str, Any]) -> dict[str, Any]:
    return {
        "event": "scoring_update",
        "matchId": gameplay["matchId"],
        "gameplay": gameplay,
    }


def result_publication(gameplay: dict[str, Any]) -> dict[str, Any]:
    return {
        "event": "result_publication",
        "matchId": gameplay["matchId"],
        "gameplay": gameplay,
    }


def social_interaction_update(match_id: str) -> dict[str, Any]:
    return {
        "event": "social_interaction_update",
        "matchId": match_id,
    }
