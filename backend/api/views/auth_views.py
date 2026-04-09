import json
import os
import secrets
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.http import HttpResponseRedirect, JsonResponse
from django.views.decorators.http import require_GET

from api.schemas import error_response, session_response
from services.identity_service import create_authenticated_session, serialize_session


SUPPORTED_PROVIDERS = {"google": "Google", "github": "GitHub"}
OAUTH_STATE_KEY = "oauth_sign_in_state"
OAUTH_PROVIDER_KEY = "oauth_sign_in_provider"


def _provider_settings(provider: str) -> dict[str, str]:
    prefix = provider.upper()
    config = {
        "client_id": os.getenv(f"{prefix}_OAUTH_CLIENT_ID", "").strip(),
        "client_secret": os.getenv(f"{prefix}_OAUTH_CLIENT_SECRET", "").strip(),
        "authorize_url": os.getenv(f"{prefix}_OAUTH_AUTHORIZE_URL", "").strip(),
        "token_url": os.getenv(f"{prefix}_OAUTH_TOKEN_URL", "").strip(),
        "userinfo_url": os.getenv(f"{prefix}_OAUTH_USERINFO_URL", "").strip(),
        "redirect_uri": os.getenv(f"{prefix}_OAUTH_REDIRECT_URI", "").strip(),
        "scope": os.getenv(f"{prefix}_OAUTH_SCOPE", "").strip(),
    }
    if not all(config.values()):
        raise ValueError(f"OAuth is not configured for {provider}.")
    return config


def _authorization_url(provider: str, state: str) -> str:
    config = _provider_settings(provider)
    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": config["scope"],
        "state": state,
    }
    if provider == "google":
        params["access_type"] = "offline"
        params["prompt"] = "consent"
    return f"{config['authorize_url']}?{urlencode(params)}"


def _fetch_json(url: str, *, data: dict[str, str] | None = None, headers: dict[str, str] | None = None):
    encoded_data = None
    request_headers = headers or {}
    if data is not None:
        encoded_data = urlencode(data).encode("utf-8")
        request_headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            **request_headers,
        }
    request = Request(url, data=encoded_data, headers=request_headers)
    with urlopen(request, timeout=10) as response:  # nosec B310
        body = response.read().decode("utf-8")
        return json.loads(body)


def _exchange_code_for_token(provider: str, code: str) -> str:
    config = _provider_settings(provider)
    payload = {
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "redirect_uri": config["redirect_uri"],
    }
    if provider == "google":
        payload["grant_type"] = "authorization_code"

    token_response = _fetch_json(
        config["token_url"],
        data=payload,
        headers={"Accept": "application/json"},
    )
    access_token = str(token_response.get("access_token", "")).strip()
    if not access_token:
        raise ValueError("OAuth sign-in failed.")
    return access_token


def _load_identity(provider: str, access_token: str) -> tuple[str, str, str]:
    config = _provider_settings(provider)
    userinfo = _fetch_json(
        config["userinfo_url"],
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "User-Agent": "blend-colour-game",
        },
    )

    if provider == "google":
        oauth_identity = str(userinfo.get("sub", "")).strip()
        display_name = str(userinfo.get("name", "")).strip()
        profile_avatar = str(userinfo.get("picture", "")).strip()
    else:
        oauth_identity = str(userinfo.get("id", "")).strip()
        display_name = str(userinfo.get("name") or userinfo.get("login") or "").strip()
        profile_avatar = str(userinfo.get("avatar_url", "")).strip()

    if not oauth_identity or not display_name:
        raise ValueError("OAuth identity could not be verified.")

    return oauth_identity, display_name, profile_avatar


def _frontend_redirect(status: str) -> str:
    base_url = settings.FRONTEND_BASE_URL.rstrip("/")
    return f"{base_url}/?oauthStatus={status}"


@require_GET
def oauth_start_view(request):
    provider = str(request.GET.get("provider", "")).strip().lower()
    if provider not in SUPPORTED_PROVIDERS:
        return JsonResponse(error_response("Unsupported OAuth provider."), status=400)

    try:
        if request.session.session_key is None:
            request.session.save()
        state = f"{provider}-{secrets.token_urlsafe(24)}"
        authorization_url = _authorization_url(provider, state)
    except ValueError as exc:
        return JsonResponse(error_response(str(exc)), status=400)

    request.session[OAUTH_STATE_KEY] = state
    request.session[OAUTH_PROVIDER_KEY] = provider
    return JsonResponse(
        {
            "provider": provider,
            "state": state,
            "authorizationUrl": authorization_url,
        }
    )


@require_GET
def oauth_complete_view(request):
    provider = str(request.GET.get("provider", "")).strip().lower()
    state = str(request.GET.get("state", "")).strip()
    code = str(request.GET.get("code", "")).strip()
    error = str(request.GET.get("error", "")).strip().lower()
    response_format = str(request.GET.get("format", "")).strip().lower()

    if provider not in SUPPORTED_PROVIDERS:
        return JsonResponse(error_response("Unsupported OAuth provider."), status=400)
    if request.session.get(OAUTH_PROVIDER_KEY) != provider:
        return JsonResponse(error_response("OAuth provider could not be verified."), status=400)
    if not state or request.session.get(OAUTH_STATE_KEY) != state:
        return JsonResponse(error_response("OAuth state could not be verified."), status=400)

    request.session.pop(OAUTH_STATE_KEY, None)
    request.session.pop(OAUTH_PROVIDER_KEY, None)

    if error in {"access_denied", "cancelled", "denied"}:
        return HttpResponseRedirect(_frontend_redirect("cancelled"))
    if error:
        return HttpResponseRedirect(_frontend_redirect("failed"))
    if not code:
        return JsonResponse(error_response("OAuth sign-in failed."), status=400)

    try:
        access_token = _exchange_code_for_token(provider, code)
        oauth_identity, display_name, profile_avatar = _load_identity(provider, access_token)
        session = create_authenticated_session(
            oauth_identity=f"{provider}:{oauth_identity}",
            display_name=display_name,
            profile_avatar=profile_avatar,
        )
    except ValueError as exc:
        if response_format != "json":
            return HttpResponseRedirect(_frontend_redirect("failed"))
        return JsonResponse(error_response(str(exc)), status=400)
    except Exception:
        if response_format != "json":
            return HttpResponseRedirect(_frontend_redirect("failed"))
        return JsonResponse(error_response("OAuth sign-in failed."), status=400)

    request.session["active_session_id"] = str(session.session_id)
    if response_format == "json":
        return JsonResponse(session_response(serialize_session(session)), status=200)
    return HttpResponseRedirect(_frontend_redirect("success"))
