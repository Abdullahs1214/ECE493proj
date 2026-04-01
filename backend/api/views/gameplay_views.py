import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.schemas import error_response, gameplay_response
from api.views.session_views import SESSION_KEY
from services.identity_service import get_active_session
from services.match_service import get_match_state, serialize_match_state, submit_color
from services.mode_service import start_gameplay_for_mode


def _load_request_data(request) -> dict[str, object]:
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
def start_gameplay_view(request):
    player = _get_active_player(request)
    if player is None:
        return JsonResponse(error_response("No active session."), status=401)

    payload = _load_request_data(request)
    mode = str(payload.get("mode", "")).strip()
    room_id = payload.get("roomId")

    try:
        match = start_gameplay_for_mode(player, mode, str(room_id) if room_id else None)
    except ValueError as exc:
        return JsonResponse(error_response(str(exc)), status=400)

    return JsonResponse(gameplay_response(serialize_match_state(match)), status=201)


@csrf_exempt
@require_http_methods(["POST"])
def submit_color_view(request):
    player = _get_active_player(request)
    if player is None:
        return JsonResponse(error_response("No active session."), status=401)

    payload = _load_request_data(request)
    match_id = str(payload.get("matchId", "")).strip()
    blended_color = payload.get("blendedColor")
    if not match_id:
        return JsonResponse(error_response("matchId is required."), status=400)
    if not isinstance(blended_color, list):
        return JsonResponse(error_response("blendedColor is required."), status=400)

    try:
        match = submit_color(player, match_id, blended_color)
    except ValueError as exc:
        return JsonResponse(error_response(str(exc)), status=400)

    return JsonResponse(gameplay_response(serialize_match_state(match)))


@require_GET
def gameplay_state_view(request):
    player = _get_active_player(request)
    if player is None:
        return JsonResponse(error_response("No active session."), status=401)

    match_id = str(request.GET.get("matchId", "")).strip()
    if not match_id:
        return JsonResponse(error_response("matchId is required."), status=400)

    try:
        match = get_match_state(player, match_id)
    except ValueError as exc:
        return JsonResponse(error_response(str(exc)), status=400)

    return JsonResponse(gameplay_response(serialize_match_state(match)))
