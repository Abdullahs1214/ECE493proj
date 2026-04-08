from unittest.mock import patch

import json
from django.test import TestCase
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory

from api.views import history_views
from apps.accounts.models import PlayerIdentity
from services.history_service import get_history_for_player
from services.match_service import start_single_player_match, submit_color


class HistoryTests(TestCase):
    @patch("engine.scoring_engine.random.randint", side_effect=[70, 80, 90])
    def test_guest_history_is_room_scoped_only(self, _mock_randint) -> None:
        player = PlayerIdentity.objects.create(
            identity_type=PlayerIdentity.IdentityType.GUEST,
            display_name="Guest History",
        )
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [70, 80, 90])

        history = get_history_for_player(player)

        self.assertEqual(len(history["roomScopedHistory"]), 1)
        self.assertEqual(history["identityScopedHistory"], [])

    @patch("engine.scoring_engine.random.randint", side_effect=[70, 80, 90])
    def test_authenticated_history_includes_identity_scope(self, _mock_randint) -> None:
        player = PlayerIdentity.objects.create(
            identity_type=PlayerIdentity.IdentityType.AUTHENTICATED,
            display_name="Auth History",
            oauth_identity="auth-history-1",
        )
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [70, 80, 90])

        history = get_history_for_player(player)

        self.assertEqual(len(history["roomScopedHistory"]), 1)
        self.assertEqual(len(history["identityScopedHistory"]), 1)

    def test_profile_and_history_views_require_active_session(self) -> None:
        def _request_with_session(request):
            middleware = SessionMiddleware(lambda req: None)
            middleware.process_request(request)
            request.session.save()
            return request

        profile_response = history_views.profile_view(
            _request_with_session(RequestFactory().get("/profile/"))
        )
        history_response = history_views.history_view(
            _request_with_session(RequestFactory().get("/history/"))
        )

        self.assertEqual(profile_response.status_code, 401)
        self.assertEqual(history_response.status_code, 401)
        self.assertEqual(json.loads(profile_response.content), {"error": "No active session."})
        self.assertEqual(json.loads(history_response.content), {"error": "No active session."})
