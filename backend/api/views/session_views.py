import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from api.exceptions import APIError, require_active_session, translate_api_error
from api.schemas import error_response, session_response
from services.identity_service import (
    create_guest_session,
    get_active_session,
    login_local_account,
    logout_session,
    register_local_account,
    serialize_session,
    update_display_name,
    update_guest_display_name,
    update_player_avatar,
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
    try:
        session = require_active_session(
            request,
            session_key=SESSION_KEY,
            resolver=get_active_session,
        )
    except Exception as exc:
        return translate_api_error(exc)
    return JsonResponse(session_response(serialize_session(session)))


@csrf_exempt
@require_http_methods(["PATCH"])
def update_session_view(request):
    try:
        session = require_active_session(
            request,
            session_key=SESSION_KEY,
            resolver=get_active_session,
        )
        payload = _load_request_data(request)
        display_name = str(payload.get("displayName", "")).strip()
        profile_avatar = str(payload.get("profileAvatar", "UNSET")).strip()

        if display_name:
            session = update_display_name(session, display_name)

        if profile_avatar != "UNSET":
            session = update_player_avatar(session, profile_avatar)

        if not display_name and profile_avatar == "UNSET":
            raise APIError("displayName or profileAvatar is required.")

    except Exception as exc:
        return translate_api_error(exc)

    return JsonResponse(session_response(serialize_session(session)))


@csrf_exempt
@require_http_methods(["POST"])
def register_local_view(request):
    try:
        payload = _load_request_data(request)
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", "")).strip()
        display_name = str(payload.get("displayName", "")).strip()
        session = register_local_account(username, password, display_name)
    except Exception as exc:
        return translate_api_error(exc)
    request.session[SESSION_KEY] = str(session.session_id)
    return JsonResponse(session_response(serialize_session(session)), status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login_local_view(request):
    try:
        payload = _load_request_data(request)
        username = str(payload.get("username", "")).strip()
        password = str(payload.get("password", "")).strip()
        session = login_local_account(username, password)
    except Exception as exc:
        return translate_api_error(exc)
    request.session[SESSION_KEY] = str(session.session_id)
    return JsonResponse(session_response(serialize_session(session)))


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    session = get_active_session(request.session.get(SESSION_KEY))
    if session is not None:
        logout_session(session)
    request.session.flush()
    return JsonResponse({"loggedOut": True})
