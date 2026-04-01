from django.http import JsonResponse
from django.views.decorators.http import require_GET

from api.schemas import error_response


@require_GET
def oauth_start_view(_request):
    return JsonResponse(
        error_response("OAuth sign-in is not implemented in this block."),
        status=501,
    )


@require_GET
def oauth_complete_view(_request):
    return JsonResponse(
        error_response("OAuth sign-in is not implemented in this block."),
        status=501,
    )
