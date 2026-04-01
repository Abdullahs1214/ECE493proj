from __future__ import annotations

from typing import Any


def session_response(session: dict[str, Any]) -> dict[str, Any]:
    return {"session": session}


def profile_response(profile: dict[str, Any]) -> dict[str, Any]:
    return {"profile": profile}


def room_response(room: dict[str, Any]) -> dict[str, Any]:
    return {"room": room}


def room_leave_response(room_closed: bool, room: dict[str, Any] | None) -> dict[str, Any]:
    return {"leftRoom": True, "roomClosed": room_closed, "room": room}


def gameplay_response(gameplay: dict[str, Any]) -> dict[str, Any]:
    return {"gameplay": gameplay}


def history_response(history: dict[str, Any]) -> dict[str, Any]:
    return {"history": history}


def social_response(social: dict[str, Any]) -> dict[str, Any]:
    return {"social": social}


def error_response(message: str) -> dict[str, str]:
    return {"error": message}
