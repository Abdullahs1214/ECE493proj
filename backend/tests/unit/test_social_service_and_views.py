import json
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory

from api.views import social_views
from apps.gameplay.models import Match, Round
from services.identity_service import create_guest_session
from services.match_service import start_single_player_match, submit_color
from services.room_service import create_room, join_room
from services.social_service import get_social_state, submit_social_interaction


def _request_with_session(request):
    middleware = SessionMiddleware(lambda req: None)
    middleware.process_request(request)
    request.session.save()
    return request


def _json(response):
    return json.loads(response.content.decode("utf-8"))


def _single_player_results_context(display_name: str = "Player One"):
    player = create_guest_session(display_name).player
    with patch("engine.scoring_engine.random.randint", side_effect=[90, 100, 110]):
        match = start_single_player_match(player)
        submit_color(player, str(match.match_id), [90, 100, 110])
    return player, match


def _multiplayer_results_context():
    host = create_guest_session("Host").player
    guest = create_guest_session("Guest").player
    room = create_room(host)
    join_room(guest, str(room.room_id))
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.RESULTS,
        current_round_number=1,
        participant_count=2,
    )
    Round.objects.create(
        match=match,
        round_number=1,
        target_color=[10, 20, 30],
        base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        time_limit=60,
        round_status=Round.RoundStatus.RESULTS,
    )
    return host, guest, match


@pytest.mark.django_db
def test_submit_social_interaction_raises_for_missing_match() -> None:
    player = create_guest_session("Player One").player

    with pytest.raises(ValueError, match="Match was not found."):
        submit_social_interaction(
            player,
            "00000000-0000-0000-0000-000000000001",
            "preset_message",
            preset_message="Nice blend!",
        )


@pytest.mark.django_db
def test_submit_social_interaction_raises_for_missing_round() -> None:
    player = create_guest_session("Player One").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.RESULTS,
        current_round_number=1,
        participant_count=1,
    )

    with pytest.raises(ValueError, match="Round was not found."):
        submit_social_interaction(
            player,
            str(match.match_id),
            "preset_message",
            preset_message="Nice blend!",
        )


@pytest.mark.django_db
def test_submit_social_interaction_raises_when_match_not_in_results() -> None:
    player = create_guest_session("Player One").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )
    Round.objects.create(
        match=match,
        round_number=1,
        target_color=[10, 20, 30],
        base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        time_limit=60,
        round_status=Round.RoundStatus.ACTIVE_BLENDING,
    )

    with pytest.raises(ValueError, match="Social interactions are only available during results."):
        submit_social_interaction(
            player,
            str(match.match_id),
            "preset_message",
            preset_message="Nice blend!",
        )


@pytest.mark.django_db
def test_get_social_state_allows_active_multiplayer_member() -> None:
    _host, guest, match = _multiplayer_results_context()

    social_state = get_social_state(guest, str(match.match_id))

    assert social_state["interactions"] == []
    assert social_state["submissionSummaries"] == []
    assert social_state["crowdFavorites"] == []


@pytest.mark.django_db
def test_submit_social_interaction_rejects_multiplayer_non_member() -> None:
    _host, _guest, match = _multiplayer_results_context()
    outsider = create_guest_session("Outsider").player

    with pytest.raises(ValueError, match="Player is not active in the room for this match."):
        submit_social_interaction(
            outsider,
            str(match.match_id),
            "preset_message",
            preset_message="Nice blend!",
        )


@pytest.mark.django_db
def test_submit_social_interaction_rejects_unsupported_preset_message() -> None:
    player, match = _single_player_results_context()

    with pytest.raises(ValueError, match="Unsupported preset message."):
        submit_social_interaction(
            player,
            str(match.match_id),
            "preset_message",
            preset_message="Hello there",
        )


@pytest.mark.django_db
def test_submit_social_interaction_rejects_unsupported_interaction_type() -> None:
    player, match = _single_player_results_context()

    with pytest.raises(ValueError, match="Unsupported interaction type."):
        submit_social_interaction(player, str(match.match_id), "wave")


@pytest.mark.django_db
def test_social_state_without_reactions_has_no_crowd_favorite() -> None:
    player, match = _single_player_results_context()

    social_state = get_social_state(player, str(match.match_id))

    assert social_state["submissionSummaries"][0]["upvoteCount"] == 0
    assert social_state["submissionSummaries"][0]["highlightCount"] == 0
    assert social_state["crowdFavorites"] == []


def test_social_view_load_request_data_handles_empty_invalid_and_non_dict_payloads() -> None:
    empty_request = RequestFactory().post("/social/submit/", data="", content_type="application/json")
    assert social_views._load_request_data(empty_request) == {}

    invalid_request = RequestFactory().post(
        "/social/submit/",
        data="{invalid",
        content_type="application/json",
    )
    assert social_views._load_request_data(invalid_request) == {}

    list_request = RequestFactory().post(
        "/social/submit/",
        data='["social"]',
        content_type="application/json",
    )
    assert social_views._load_request_data(list_request) == {}


@pytest.mark.django_db
def test_submit_social_view_requires_active_session() -> None:
    request = _request_with_session(
        RequestFactory().post("/social/submit/", data="{}", content_type="application/json")
    )

    response = social_views.submit_social_view(request)

    assert response.status_code == 401
    assert _json(response) == {"error": "No active session."}


@pytest.mark.django_db
def test_submit_social_view_requires_match_id_and_interaction_type() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(
        RequestFactory().post("/social/submit/", data="{}", content_type="application/json")
    )

    with patch("api.views.social_views.get_active_session", return_value=SimpleNamespace(player=player)):
        response = social_views.submit_social_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "matchId and interactionType are required."}


@pytest.mark.django_db
def test_submit_social_view_returns_service_errors() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(
        RequestFactory().post(
            "/social/submit/",
            data='{"matchId":"match-1","interactionType":"upvote"}',
            content_type="application/json",
        )
    )

    with (
        patch("api.views.social_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch(
            "api.views.social_views.submit_social_interaction",
            side_effect=ValueError("Target submission was not found."),
        ),
    ):
        response = social_views.submit_social_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "Target submission was not found."}


@pytest.mark.django_db
def test_social_state_view_requires_active_session() -> None:
    request = _request_with_session(RequestFactory().get("/social/state/"))

    response = social_views.social_state_view(request)

    assert response.status_code == 401
    assert _json(response) == {"error": "No active session."}


@pytest.mark.django_db
def test_social_state_view_requires_match_id() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(RequestFactory().get("/social/state/"))

    with patch("api.views.social_views.get_active_session", return_value=SimpleNamespace(player=player)):
        response = social_views.social_state_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "matchId is required."}


@pytest.mark.django_db
def test_social_state_view_returns_service_errors() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(RequestFactory().get("/social/state/?matchId=match-1"))

    with (
        patch("api.views.social_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch("api.views.social_views.get_social_state", side_effect=ValueError("Match was not found.")),
    ):
        response = social_views.social_state_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "Match was not found."}
