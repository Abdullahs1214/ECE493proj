import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from api.schemas import error_response, room_leave_response, room_response
from api.views.session_views import SESSION_KEY
from services.identity_service import get_active_session
from services.room_service import create_room, join_room, leave_room, serialize_room


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
    session = get_active_session(request.session.get(SESSION_KEY))
    if session is None:
        return None
    return session.player


@csrf_exempt
@require_http_methods(["POST"])
def create_room_view(request):
    player = _get_active_player(request)
    if player is None:
        return JsonResponse(error_response("No active session."), status=401)

    room = create_room(player)
    return JsonResponse(room_response(serialize_room(room)), status=201)


@csrf_exempt
@require_http_methods(["POST"])
def join_room_view(request):
    player = _get_active_player(request)
    if player is None:
        return JsonResponse(error_response("No active session."), status=401)

    payload = _load_request_data(request)
    room_id = str(payload.get("roomId", "")).strip()
    if not room_id:
        return JsonResponse(error_response("roomId is required."), status=400)

    try:
        room = join_room(player, room_id)
    except ValueError as exc:
        return JsonResponse(error_response(str(exc)), status=400)

    return JsonResponse(room_response(serialize_room(room)))


@csrf_exempt
@require_http_methods(["POST"])
def leave_room_view(request):
    player = _get_active_player(request)
    if player is None:
        return JsonResponse(error_response("No active session."), status=401)

    payload = _load_request_data(request)
    room_id = str(payload.get("roomId", "")).strip()
    if not room_id:
        return JsonResponse(error_response("roomId is required."), status=400)

    try:
        room_closed, room = leave_room(player, room_id)
    except ValueError as exc:
        return JsonResponse(error_response(str(exc)), status=400)

    serialized_room = serialize_room(room) if room is not None else None
    return JsonResponse(room_leave_response(room_closed, serialized_room))
