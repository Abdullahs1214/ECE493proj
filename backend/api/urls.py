from django.urls import path

from api.health import health_view
from api.views.auth_views import oauth_complete_view, oauth_start_view
from api.views.history_views import profile_view
from api.views.session_views import (
    current_session_view,
    guest_entry_view,
    logout_view,
    update_session_view,
)


urlpatterns = [
    path("health/", health_view, name="health"),
    path("auth/oauth/start/", oauth_start_view, name="oauth-start"),
    path("auth/oauth/complete/", oauth_complete_view, name="oauth-complete"),
    path("sessions/guest/", guest_entry_view, name="guest-entry"),
    path("sessions/current/", current_session_view, name="current-session"),
    path("sessions/current/update/", update_session_view, name="update-session"),
    path("sessions/logout/", logout_view, name="logout"),
    path("profile/", profile_view, name="profile"),
]
