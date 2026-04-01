from __future__ import annotations

from typing import Any


def session_response(session: dict[str, Any]) -> dict[str, Any]:
    return {"session": session}


def profile_response(profile: dict[str, Any]) -> dict[str, Any]:
    return {"profile": profile}


def error_response(message: str) -> dict[str, str]:
    return {"error": message}
