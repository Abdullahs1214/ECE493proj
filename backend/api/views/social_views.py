import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.exceptions import APIError, require_active_session, translate_api_error
from api.schemas import social_response
from api.views.session_views import SESSION_KEY
from services.identity_service import get_active_session
from services.social_service import get_social_state, submit_social_interaction


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
    session = require_active_session(
        request,
        session_key=SESSION_KEY,
        resolver=get_active_session,
    )
    return session.player


@csrf_exempt
@require_http_methods(["POST"])
def submit_social_view(request):
    try:
        player = _get_active_player(request)
        payload = _load_request_data(request)
        match_id = str(payload.get("matchId", "")).strip()
        interaction_type = str(payload.get("interactionType", "")).strip()
        target_submission_id = payload.get("targetSubmissionId")
        preset_message = payload.get("presetMessage")
        if not match_id or not interaction_type:
            raise APIError("matchId and interactionType are required.")
        submit_social_interaction(
            player,
            match_id,
            interaction_type,
            str(target_submission_id) if target_submission_id else None,
            str(preset_message) if preset_message else None,
        )
        social_state = get_social_state(player, match_id)
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(social_response(social_state), status=201)


@require_GET
def social_state_view(request):
    try:
        player = _get_active_player(request)
        match_id = str(request.GET.get("matchId", "")).strip()
        if not match_id:
            raise APIError("matchId is required.")
        social_state = get_social_state(player, match_id)
    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(social_response(social_state))
