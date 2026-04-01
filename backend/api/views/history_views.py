from django.http import JsonResponse
from django.views.decorators.http import require_GET

from api.schemas import error_response, history_response, profile_response
from api.views.session_views import SESSION_KEY
from services.identity_service import get_active_session, serialize_profile
from services.history_service import get_history_for_player


@require_GET
def profile_view(request):
    session = get_active_session(request.session.get(SESSION_KEY))
    if session is None:
        return JsonResponse(error_response("No active session."), status=401)
    return JsonResponse(profile_response(serialize_profile(session.player)))


@require_GET
def history_view(request):
    session = get_active_session(request.session.get(SESSION_KEY))
    if session is None:
        return JsonResponse(error_response("No active session."), status=401)
    return JsonResponse(history_response(get_history_for_player(session.player)))
