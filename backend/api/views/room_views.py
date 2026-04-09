import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.exceptions import APIError, require_active_session, translate_api_error
from api.schemas import room_leave_response, room_list_response, room_response
from api.views.session_views import SESSION_KEY
from services.identity_service import get_active_session
from services.room_service import (
    create_room,
    delete_room,
    get_room_for_player,
    join_room,
    leave_room,
    list_rooms,
    serialize_room,
)


def _load_request_data(request) -> dict[str, str]:
    if not request.body:
        return {}
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return {}
    if isinstance(payload, dict):
        return payload
    return {}


def _get_active_player(request):
    session = require_active_session(
        request,
        session_key=SESSION_KEY,
        resolver=get_active_session,
    )
    return session.player


@csrf_exempt
@require_http_methods(["POST"])
def create_room_view(request):
    try:
        player = _get_active_player(request)
        room = create_room(player)
    except Exception as exc:
        return translate_api_error(exc)
    return JsonResponse(room_response(serialize_room(room)), status=201)


@csrf_exempt
@require_http_methods(["POST"])
def join_room_view(request):
    try:
        player = _get_active_player(request)
        payload = _load_request_data(request)
        room_id = str(payload.get("roomId", "")).strip()
        if not room_id:
            raise APIError("roomId is required.")
        room = join_room(player, room_id)
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(room_response(serialize_room(room)))


@csrf_exempt
@require_http_methods(["POST"])
def leave_room_view(request):
    try:
        player = _get_active_player(request)
        payload = _load_request_data(request)
        room_id = str(payload.get("roomId", "")).strip()
        if not room_id:
            raise APIError("roomId is required.")
        room_closed, room = leave_room(player, room_id)
    except Exception as exc:
        return translate_api_error(exc)

    serialized_room = serialize_room(room) if room is not None else None
    return JsonResponse(room_leave_response(room_closed, serialized_room))


@require_GET
def browse_rooms_view(_request):
    return JsonResponse(room_list_response(list_rooms()))


@require_GET
def current_room_view(request):
    try:
        player = _get_active_player(request)
        room = get_room_for_player(player)
    except Exception as exc:
        return translate_api_error(exc)
    return JsonResponse(room_response(serialize_room(room) if room is not None else None))


@csrf_exempt
@require_http_methods(["POST"])
def delete_room_view(request):
    try:
        player = _get_active_player(request)
        payload = _load_request_data(request)
        room_id = str(payload.get("roomId", "")).strip()
        if not room_id:
            raise APIError("roomId is required.")
        delete_room(player, room_id)
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse({"roomClosed": True})
