import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.schemas import error_response, session_response
from services.identity_service import (
    create_guest_session,
    get_active_session,
    serialize_session,
    update_guest_display_name,
    logout_session,
)


SESSION_KEY = "active_session_id"


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


@csrf_exempt
@require_http_methods(["POST"])
def guest_entry_view(request):
    payload = _load_request_data(request)
    session = create_guest_session(payload.get("displayName"))
    request.session[SESSION_KEY] = str(session.session_id)
    return JsonResponse(session_response(serialize_session(session)), status=201)


@require_GET
def current_session_view(request):
    session = get_active_session(request.session.get(SESSION_KEY))
    if session is None:
        return JsonResponse(error_response("No active session."), status=401)
    return JsonResponse(session_response(serialize_session(session)))


@csrf_exempt
@require_http_methods(["PATCH"])
def update_session_view(request):
    session = get_active_session(request.session.get(SESSION_KEY))
    if session is None:
        return JsonResponse(error_response("No active session."), status=401)

    payload = _load_request_data(request)
    display_name = str(payload.get("displayName", "")).strip()
    if not display_name:
        return JsonResponse(error_response("displayName is required."), status=400)

    updated_session = update_guest_display_name(session, display_name)
    return JsonResponse(session_response(serialize_session(updated_session)))


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    session = get_active_session(request.session.get(SESSION_KEY))
    if session is not None:
        logout_session(session)
    request.session.flush()
    return JsonResponse({"loggedOut": True})
