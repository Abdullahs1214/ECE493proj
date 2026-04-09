from django.http import JsonResponse
from django.views.decorators.http import require_GET

from api.exceptions import require_active_session, translate_api_error
from api.schemas import history_response, profile_response
from api.views.session_views import SESSION_KEY
from services.identity_service import get_active_session, serialize_profile
from services.history_service import get_history_for_player


@require_GET
def profile_view(request):
    try:
        session = require_active_session(
            request,
            session_key=SESSION_KEY,
            resolver=get_active_session,
        )
    except Exception as exc:
        return translate_api_error(exc)
    return JsonResponse(profile_response(serialize_profile(session.player)))


@require_GET
def history_view(request):
    try:
        session = require_active_session(
            request,
            session_key=SESSION_KEY,
            resolver=get_active_session,
        )
    except Exception as exc:
        return translate_api_error(exc)
    return JsonResponse(history_response(get_history_for_player(session.player)))
