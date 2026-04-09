import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.exceptions import APIError, require_active_session, translate_api_error
from api.schemas import gameplay_response
from api.views.session_views import SESSION_KEY
from services.identity_service import get_active_session
from services.match_service import advance_round, get_match_state, serialize_match_state, submit_color
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
    try:
        session = require_active_session(
            request,
            session_key=SESSION_KEY,
            resolver=get_active_session,
        )
    except APIError:
        return None
    return session.player


@csrf_exempt
@require_http_methods(["POST"])
def start_gameplay_view(request):
    try:
        player = _get_active_player(request)
        if player is None:
            raise APIError("No active session.", status=401)
        payload = _load_request_data(request)
        mode = str(payload.get("mode", "")).strip()
        room_id = payload.get("roomId")
        match = start_gameplay_for_mode(player, mode, str(room_id) if room_id else None)
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(gameplay_response(serialize_match_state(match)), status=201)


@csrf_exempt
@require_http_methods(["POST"])
def submit_color_view(request):
    try:
        player = _get_active_player(request)
        if player is None:
            raise APIError("No active session.", status=401)
        payload = _load_request_data(request)
        match_id = str(payload.get("matchId", "")).strip()
        mix_weights = payload.get("mixWeights")
        blended_color = payload.get("blendedColor")
        if not match_id:
            raise APIError("matchId is required.")
        if not isinstance(mix_weights, list) and not isinstance(blended_color, list):
            raise APIError("mixWeights is required.")
        match = submit_color(
            player,
            match_id,
            blended_color if isinstance(blended_color, list) else None,
            mix_weights if isinstance(mix_weights, list) else None,
        )
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(gameplay_response(serialize_match_state(match)))


@csrf_exempt
@require_http_methods(["POST"])
def advance_round_view(request):
    try:
        player = _get_active_player(request)
        if player is None:
            raise APIError("No active session.", status=401)
        payload = _load_request_data(request)
        match_id = str(payload.get("matchId", "")).strip()
        if not match_id:
            raise APIError("matchId is required.")
        match = advance_round(player, match_id)
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(gameplay_response(serialize_match_state(match)))


@require_GET
def gameplay_state_view(request):
    try:
        player = _get_active_player(request)
        if player is None:
            raise APIError("No active session.", status=401)
        match_id = str(request.GET.get("matchId", "")).strip()
        if not match_id:
            raise APIError("matchId is required.")
        match = get_match_state(player, match_id)
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(gameplay_response(serialize_match_state(match)))
