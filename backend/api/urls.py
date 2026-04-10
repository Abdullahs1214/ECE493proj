from django.urls import path

from api.health import health_view
from api.views.auth_views import oauth_complete_view, oauth_start_view
from api.views.gameplay_views import advance_round_view, gameplay_state_view, start_gameplay_view, submit_color_view
from api.views.history_views import history_view, profile_view
from api.views.room_views import (
    browse_rooms_view,
    create_room_view,
    current_room_view,
    delete_room_view,
    join_room_view,
    leave_room_view,
)
from api.views.social_views import social_state_view, submit_social_view
from api.views.session_views import (
    current_session_view,
    guest_entry_view,
    login_local_view,
    logout_view,
    register_local_view,
    update_session_view,
)


urlpatterns = [
    path("health/", health_view, name="health"),
    path("auth/oauth/start/", oauth_start_view, name="oauth-start"),
    path("auth/oauth/complete/", oauth_complete_view, name="oauth-complete"),
    path("sessions/register/", register_local_view, name="register-local"),
    path("sessions/login/", login_local_view, name="login-local"),
    path("sessions/guest/", guest_entry_view, name="guest-entry"),
    path("sessions/current/", current_session_view, name="current-session"),
    path("sessions/current/update/", update_session_view, name="update-session"),
    path("sessions/logout/", logout_view, name="logout"),
    path("profile/", profile_view, name="profile"),
    path("history/", history_view, name="history"),
    path("rooms/create/", create_room_view, name="create-room"),
    path("rooms/", browse_rooms_view, name="browse-rooms"),
    path("rooms/current/", current_room_view, name="current-room"),
    path("rooms/join/", join_room_view, name="join-room"),
    path("rooms/leave/", leave_room_view, name="leave-room"),
    path("rooms/delete/", delete_room_view, name="delete-room"),
    path("gameplay/start/", start_gameplay_view, name="gameplay-start"),
    path("gameplay/submit/", submit_color_view, name="gameplay-submit"),
    path("gameplay/advance/", advance_round_view, name="gameplay-advance"),
    path("gameplay/state/", gameplay_state_view, name="gameplay-state"),
    path("social/submit/", submit_social_view, name="social-submit"),
    path("social/state/", social_state_view, name="social-state"),
]
