import json
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory
from django.utils import timezone

from api.views import gameplay_views
from apps.gameplay.models import Match, Round, Submission
from apps.gameplay.validators import (
    validate_color_ranges,
    validate_submission_window,
    validate_tie_break_basis,
)
from engine.round_engine import finalize_round_if_ready, register_submission
from services.identity_service import create_guest_session


def _request_with_session(request):
    middleware = SessionMiddleware(lambda req: None)
    middleware.process_request(request)
    request.session.save()
    return request


def _json(response):
    return json.loads(response.content.decode("utf-8"))


def _single_player_round(player_name: str = "Player One"):
    player = create_guest_session(player_name).player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )
    round_instance = Round.objects.create(
        match=match,
        round_number=1,
        target_color=[10, 20, 30],
        base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        time_limit=60,
        round_status=Round.RoundStatus.ACTIVE_BLENDING,
    )
    return player, match, round_instance


def test_gameplay_view_load_request_data_handles_empty_invalid_and_non_dict_payloads() -> None:
    empty_request = RequestFactory().post("/gameplay/start/", data="", content_type="application/json")
    assert gameplay_views._load_request_data(empty_request) == {}

    invalid_request = RequestFactory().post(
        "/gameplay/start/",
        data="{invalid",
        content_type="application/json",
    )
    assert gameplay_views._load_request_data(invalid_request) == {}

    list_request = RequestFactory().post(
        "/gameplay/start/",
        data='["single_player"]',
        content_type="application/json",
    )
    assert gameplay_views._load_request_data(list_request) == {}


@pytest.mark.django_db
def test_gameplay_view_get_active_player_returns_none_without_active_session() -> None:
    request = _request_with_session(RequestFactory().post("/gameplay/start/"))

    assert gameplay_views._get_active_player(request) is None


@pytest.mark.django_db
def test_start_gameplay_view_requires_active_session() -> None:
    request = _request_with_session(RequestFactory().post("/gameplay/start/"))

    response = gameplay_views.start_gameplay_view(request)

    assert response.status_code == 401
    assert _json(response) == {"error": "No active session."}


@pytest.mark.django_db
def test_start_gameplay_view_returns_service_errors() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(
        RequestFactory().post(
            "/gameplay/start/",
            data='{"mode":"multiplayer"}',
            content_type="application/json",
        )
    )

    with (
        patch("api.views.gameplay_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch(
            "api.views.gameplay_views.start_gameplay_for_mode",
            side_effect=ValueError("roomId is required for multiplayer mode."),
        ),
    ):
        response = gameplay_views.start_gameplay_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "roomId is required for multiplayer mode."}


@pytest.mark.django_db
def test_submit_color_view_requires_active_session() -> None:
    request = _request_with_session(RequestFactory().post("/gameplay/submit/"))

    response = gameplay_views.submit_color_view(request)

    assert response.status_code == 401
    assert _json(response) == {"error": "No active session."}


@pytest.mark.django_db
def test_submit_color_view_requires_match_id() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(
        RequestFactory().post(
            "/gameplay/submit/",
            data='{"blendedColor":[10,20,30]}',
            content_type="application/json",
        )
    )

    with patch("api.views.gameplay_views.get_active_session", return_value=SimpleNamespace(player=player)):
        response = gameplay_views.submit_color_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "matchId is required."}


@pytest.mark.django_db
def test_submit_color_view_requires_blended_color_list() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(
        RequestFactory().post(
            "/gameplay/submit/",
            data='{"matchId":"match-1","blendedColor":"bad"}',
            content_type="application/json",
        )
    )

    with patch("api.views.gameplay_views.get_active_session", return_value=SimpleNamespace(player=player)):
        response = gameplay_views.submit_color_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "blendedColor is required."}


@pytest.mark.django_db
def test_submit_color_view_returns_service_errors() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(
        RequestFactory().post(
            "/gameplay/submit/",
            data='{"matchId":"match-1","blendedColor":[10,20,30]}',
            content_type="application/json",
        )
    )

    with (
        patch("api.views.gameplay_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch(
            "api.views.gameplay_views.submit_color",
            side_effect=ValueError("Match was not found."),
        ),
    ):
        response = gameplay_views.submit_color_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "Match was not found."}


@pytest.mark.django_db
def test_gameplay_state_view_requires_active_session() -> None:
    request = _request_with_session(RequestFactory().get("/gameplay/state/"))

    response = gameplay_views.gameplay_state_view(request)

    assert response.status_code == 401
    assert _json(response) == {"error": "No active session."}


@pytest.mark.django_db
def test_gameplay_state_view_requires_match_id() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(RequestFactory().get("/gameplay/state/"))

    with patch("api.views.gameplay_views.get_active_session", return_value=SimpleNamespace(player=player)):
        response = gameplay_views.gameplay_state_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "matchId is required."}


@pytest.mark.django_db
def test_gameplay_state_view_returns_service_errors() -> None:
    player = create_guest_session("Player One").player
    request = _request_with_session(RequestFactory().get("/gameplay/state/?matchId=match-1"))

    with (
        patch("api.views.gameplay_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch(
            "api.views.gameplay_views.get_match_state",
            side_effect=ValueError("Match was not found."),
        ),
    ):
        response = gameplay_views.gameplay_state_view(request)

    assert response.status_code == 400
    assert _json(response) == {"error": "Match was not found."}


def test_validate_color_ranges_rejects_wrong_channel_count() -> None:
    with pytest.raises(ValueError, match="Color must contain exactly three channels."):
        validate_color_ranges([10, 20])


def test_validate_tie_break_basis_rejects_unsupported_value() -> None:
    with pytest.raises(ValueError, match="Unsupported tie-break basis."):
        validate_tie_break_basis("rounded_distance")


@pytest.mark.django_db
def test_validate_submission_window_rejects_closed_round() -> None:
    _player, _match, round_instance = _single_player_round()
    round_instance.round_status = Round.RoundStatus.RESULTS
    round_instance.save(update_fields=["round_status"])

    with pytest.raises(ValueError, match="Submission window is closed."):
        validate_submission_window(round_instance)


@pytest.mark.django_db
def test_validate_submission_window_rejects_expired_round() -> None:
    _player, _match, round_instance = _single_player_round()
    round_instance.started_at = timezone.now() - timedelta(seconds=61)
    round_instance.save(update_fields=["started_at"])

    with pytest.raises(ValueError, match="Submission arrived after timer expiry."):
        validate_submission_window(round_instance)


@pytest.mark.django_db
def test_register_submission_rejects_duplicate_submission() -> None:
    player, _match, round_instance = _single_player_round()
    Submission.objects.create(
        round=round_instance,
        player=player,
        blended_color=[10, 20, 30],
        submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=1,
    )

    with pytest.raises(ValueError, match="Submission already received for this round."):
        register_submission(round_instance, player, [10, 20, 30])


@pytest.mark.django_db
def test_finalize_round_if_ready_returns_without_round() -> None:
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )

    with patch("engine.round_engine.build_score_records") as mock_build_score_records:
        finalize_round_if_ready(match)

    match.refresh_from_db()
    assert match.match_status == Match.MatchStatus.ACTIVE_ROUND
    mock_build_score_records.assert_not_called()
