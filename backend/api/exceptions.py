from __future__ import annotations

from typing import Callable, TypeVar

from django.http import JsonResponse

from api.schemas import error_response


T = TypeVar("T")


class APIError(Exception):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


def error_json(message: str, status: int = 400) -> JsonResponse:
    return JsonResponse(error_response(message), status=status)


def require_value(value: T | None, message: str, status: int = 400) -> T:
    if value is None:
        raise APIError(message, status=status)
    return value


def require_active_session(
    request,
    *,
    session_key: str,
    resolver: Callable[[str | None], T | None],
) -> T:
    return require_value(
        resolver(request.session.get(session_key)),
        "No active session.",
        status=401,
    )


def translate_api_error(exc: Exception) -> JsonResponse:
    if isinstance(exc, APIError):
        return error_json(exc.message, status=exc.status)
    if isinstance(exc, ValueError):
        return error_json(str(exc), status=400)
    return error_json("Request could not be completed.", status=500)
