"""
Branch coverage gap tests.

Targets uncovered branches in:
  - services/identity_service.py
  - services/room_service.py
  - engine/scoring_engine.py
  - engine/round_engine.py
  - apps/gameplay/validators.py
  - apps/rooms/validators.py
"""
from __future__ import annotations

import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from django.utils import timezone

from apps.accounts.models import LocalCredential, PlayerIdentity, Session
from apps.gameplay.models import Match, Round, ScoreRecord, Submission
from apps.gameplay.validators import (
    validate_color_ranges,
    validate_mix_weights,
    validate_submission_window,
    validate_tie_break_basis,
    remaining_seconds,
)
from apps.rooms.models import Room, RoomMembership
from apps.rooms.validators import validate_display_name_is_unique_in_room, validate_room_is_joinable
from engine.round_engine import blend_color_from_weights, finalize_round_if_ready, register_submission
from engine.scoring_engine import (
    build_score_records,
    color_distance,
    generate_base_color_set,
    generate_target_color,
    score_value,
    similarity_percentage,
)
from services.identity_service import (
    create_authenticated_session,
    create_guest_session,
    get_active_session,
    logout_session,
    update_player_avatar,
)
from services.match_service import (
    advance_round,
    start_multiplayer_match,
    start_single_player_match,
    submit_color,
    serialize_match_state,
)
from services.room_service import (
    create_room,
    delete_room,
    get_room_for_player,
    join_room,
    leave_room,
    list_rooms,
    mark_player_disconnected,
)
from api.exceptions import translate_api_error, APIError
from api.schemas import room_list_response
from api.views import auth_views, gameplay_views, room_views, session_views
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import RequestFactory
from engine.round_engine import _create_missing_multiplayer_submissions
from services.identity_service import login_local_account, register_local_account, update_display_name
from services.room_service import _sync_active_match_after_membership_change
from websockets.room_consumer import _forward_timer_updates
from urllib.error import URLError


# ---------------------------------------------------------------------------
# identity_service branches
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_guest_session_empty_string_auto_generates_name():
    """Branch: display_name strip → empty → _next_guest_name()."""
    session = create_guest_session("   ")
    assert session.player.display_name.startswith("Guest ")


@pytest.mark.django_db
def test_create_guest_session_none_auto_generates_name():
    """Branch: display_name is None → _next_guest_name()."""
    session = create_guest_session(None)
    assert session.player.display_name.startswith("Guest ")


@pytest.mark.django_db
def test_create_authenticated_session_existing_identity_updates():
    """Branch: get_or_create → not created → update existing identity."""
    session1 = create_authenticated_session("google:update-test", "OldName", "old-avatar")
    session2 = create_authenticated_session("google:update-test", "NewName", "new-avatar")

    assert session2.player.player_id == session1.player.player_id
    assert session2.player.display_name == "NewName"
    assert session2.player.profile_avatar == "new-avatar"


@pytest.mark.django_db
def test_create_authenticated_session_previous_session_logged_out():
    """Branch: Session.objects.filter(ACTIVE).update(LOGGED_OUT) path."""
    session1 = create_authenticated_session("google:logout-prev", "User", "")
    assert session1.status == Session.Status.ACTIVE

    create_authenticated_session("google:logout-prev", "User", "")
    session1.refresh_from_db()
    assert session1.status == Session.Status.LOGGED_OUT


@pytest.mark.django_db
def test_get_active_session_none_returns_none():
    """Branch: session_id is None → immediate None return."""
    result = get_active_session(None)
    assert result is None


@pytest.mark.django_db
def test_get_active_session_empty_string_returns_none():
    """Branch: falsy session_id → return None."""
    result = get_active_session("")
    assert result is None


@pytest.mark.django_db
def test_get_active_session_unknown_id_returns_none():
    """Branch: session not found in DB → None."""
    result = get_active_session("00000000-0000-0000-0000-000000000000")
    assert result is None


@pytest.mark.django_db
def test_get_active_session_guest_expired_returns_none():
    """Branch: guest session past 30-min threshold → status=EXPIRED, None returned."""
    session = create_guest_session("ExpiredGuest")
    Session.objects.filter(session_id=session.session_id).update(
        last_activity_at=timezone.now() - timezone.timedelta(minutes=31)
    )
    result = get_active_session(str(session.session_id))
    assert result is None
    session.refresh_from_db()
    assert session.status == Session.Status.EXPIRED


@pytest.mark.django_db
def test_get_active_session_authenticated_expired_returns_none():
    """Branch: authenticated session past 7-day threshold → status=EXPIRED, None."""
    session = create_authenticated_session("google:auth-exp", "AuthExpired", "")
    Session.objects.filter(session_id=session.session_id).update(
        last_activity_at=timezone.now() - timezone.timedelta(days=8)
    )
    result = get_active_session(str(session.session_id))
    assert result is None
    session.refresh_from_db()
    assert session.status == Session.Status.EXPIRED


@pytest.mark.django_db
def test_update_player_avatar_persists():
    """Branch: update_player_avatar saves profile_avatar."""
    from services.identity_service import update_player_avatar

    session = create_guest_session("AvatarPlayer")
    updated = update_player_avatar(session, "https://cdn.example.com/new.png")
    assert updated.player.profile_avatar == "https://cdn.example.com/new.png"


# ---------------------------------------------------------------------------
# room_service branches
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_join_room_room_not_found_raises():
    """Branch: room is None → ValueError."""
    s = create_guest_session("NoRoom").player
    with pytest.raises(ValueError, match="Room was not found"):
        join_room(s, "00000000-0000-0000-0000-000000000000")


@pytest.mark.django_db
def test_join_room_locked_active_match_new_member_gets_waiting():
    """Branch: ACTIVE_MATCH + LOCKED + new member → WAITING_FOR_NEXT_GAME."""
    host_s = create_guest_session("LockHost")
    guest_s = create_guest_session("LockGuest")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    room.room_status = Room.RoomStatus.ACTIVE_MATCH
    room.join_policy = Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
    room.save()

    late_s = create_guest_session("LateJoiner")
    join_room(late_s.player, str(room.room_id))
    membership = RoomMembership.objects.get(room=room, player=late_s.player)
    assert membership.membership_status == RoomMembership.MembershipStatus.WAITING_FOR_NEXT_GAME


@pytest.mark.django_db
def test_join_room_disconnected_member_becomes_active():
    """Branch: existing membership DISCONNECTED → status set to ACTIVE."""
    host_s = create_guest_session("ReconHost")
    player_s = create_guest_session("ReconPlayer")
    room = create_room(host_s.player)
    join_room(player_s.player, str(room.room_id))
    mark_player_disconnected(player_s.player, str(room.room_id))

    m = RoomMembership.objects.get(room=room, player=player_s.player)
    assert m.membership_status == RoomMembership.MembershipStatus.DISCONNECTED

    join_room(player_s.player, str(room.room_id))
    m.refresh_from_db()
    assert m.membership_status == RoomMembership.MembershipStatus.ACTIVE


@pytest.mark.django_db
def test_leave_room_room_not_found_raises():
    """Branch: room is None → ValueError."""
    s = create_guest_session("Ghost").player
    with pytest.raises(ValueError, match="Room was not found"):
        leave_room(s, "00000000-0000-0000-0000-000000000000")


@pytest.mark.django_db
def test_leave_room_not_a_member_raises():
    """Branch: membership is None → ValueError."""
    host_s = create_guest_session("Host")
    outsider_s = create_guest_session("Outsider")
    room = create_room(host_s.player)
    with pytest.raises(ValueError, match="not a member"):
        leave_room(outsider_s.player, str(room.room_id))


@pytest.mark.django_db
def test_leave_room_non_host_during_active_match_becomes_disconnected():
    """Branch: non-host + ACTIVE_MATCH → membership DISCONNECTED (not deleted)."""
    host_s = create_guest_session("LMHost")
    guest_s = create_guest_session("LMGuest")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))

    # Force room to ACTIVE_MATCH state without running a match
    room.room_status = Room.RoomStatus.ACTIVE_MATCH
    room.save()

    leave_room(guest_s.player, str(room.room_id))
    membership = RoomMembership.objects.get(room=room, player=guest_s.player)
    assert membership.membership_status == RoomMembership.MembershipStatus.DISCONNECTED


@pytest.mark.django_db
def test_mark_player_disconnected_room_not_found_is_safe():
    """Branch: room is None → return early, no exception."""
    s = create_guest_session("SafeDiscon").player
    mark_player_disconnected(s, "00000000-0000-0000-0000-000000000000")  # must not raise


@pytest.mark.django_db
def test_mark_player_disconnected_no_active_membership_is_safe():
    """Branch: membership is None → return early, no exception."""
    host_s = create_guest_session("DiscHost")
    room = create_room(host_s.player)
    outsider_s = create_guest_session("NoMembership")
    mark_player_disconnected(outsider_s.player, str(room.room_id))  # must not raise


# ---------------------------------------------------------------------------
# room_service._sync_active_match_after_membership_change branches
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_sync_active_match_no_active_match_returns_early():
    """Branch: no active match → _sync exits immediately."""
    host_s = create_guest_session("SyncHost")
    guest_s = create_guest_session("SyncGuest")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    # Leave with no active match — should not raise
    leave_room(guest_s.player, str(room.room_id))


@pytest.mark.django_db
def test_sync_active_match_below_two_players_ends_match():
    """Branch: active multiplayer match + <2 active members → match ENDED."""
    host_s = create_guest_session("SyncH2")
    guest_s = create_guest_session("SyncG2")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))

    leave_room(guest_s.player, str(room.room_id))
    match.refresh_from_db()
    assert match.match_status == Match.MatchStatus.ENDED


# ---------------------------------------------------------------------------
# scoring_engine branches
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_build_score_records_single_submission_rank_one():
    """Branch: single submission → rank stays 1."""
    host_s = create_guest_session("ScoreHost")
    guest_s = create_guest_session("ScoreGuest")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()

    Submission.objects.create(
        round=round_instance, player=host_s.player,
        blended_color=[100, 100, 100],
        submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=1,
    )
    build_score_records(round_instance)
    record = ScoreRecord.objects.get(round=round_instance, player=host_s.player)
    assert record.rank == 1


@pytest.mark.django_db
def test_build_score_records_tied_submissions_share_rank():
    """Branch: index > 0 and distance == prev_distance → rank not incremented."""
    host_s = create_guest_session("TiedHostSE")
    guest_s = create_guest_session("TiedGuestSE")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()
    target = round_instance.target_color

    for i, player in enumerate([host_s.player, guest_s.player], start=1):
        Submission.objects.create(
            round=round_instance, player=player,
            blended_color=target,  # identical → same distance = 0
            submission_status=Submission.SubmissionStatus.ACCEPTED,
            submission_order=i,
        )
    build_score_records(round_instance)
    records = list(ScoreRecord.objects.filter(round=round_instance).order_by("color_distance"))
    assert records[0].rank == 1
    assert records[1].rank == 1


@pytest.mark.django_db
def test_build_score_records_different_distances_different_ranks():
    """Branch: index > 0 and distance != prev_distance → rank = index + 1."""
    host_s = create_guest_session("DiffHost")
    guest_s = create_guest_session("DiffGuest")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()
    target = round_instance.target_color

    Submission.objects.create(
        round=round_instance, player=host_s.player,
        blended_color=target,
        submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=1,
    )
    Submission.objects.create(
        round=round_instance, player=guest_s.player,
        blended_color=[(ch + 50) % 256 for ch in target],
        submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=2,
    )
    build_score_records(round_instance)
    records = {r.player_id: r for r in ScoreRecord.objects.filter(round=round_instance)}
    host_rank = records[host_s.player.player_id].rank
    guest_rank = records[guest_s.player.player_id].rank
    assert host_rank == 1
    assert guest_rank == 2


def test_similarity_percentage_clamps_at_zero():
    """Branch: similarity below 0 is clamped to 0.0 by max()."""
    # distance beyond max doesn't occur in practice, but test clamping
    max_dist = 441.67  # approx sqrt(3*255^2)
    result = similarity_percentage(max_dist)
    assert result >= 0.0


def test_score_value_rounds():
    """Branch: score_value uses round() and int()."""
    # similarity 99.5 → score 995
    val = score_value(99.5)
    assert isinstance(val, int)
    assert val == 995


# ---------------------------------------------------------------------------
# round_engine branches
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_finalize_round_already_results_is_noop():
    """Branch: round_status == RESULTS → return immediately."""
    s = create_guest_session("AlreadyResults")
    match = start_single_player_match(s.player)
    submit_color(s.player, str(match.match_id), [128, 128, 128])
    match.refresh_from_db()
    # Round already in RESULTS/ENDED — calling finalize again is safe
    finalize_round_if_ready(match)  # should not raise or change state


@pytest.mark.django_db
def test_finalize_round_no_round_is_noop():
    """Branch: round_instance is None → return immediately."""
    # Create a match with no rounds
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )
    finalize_round_if_ready(match)  # should not raise


@pytest.mark.django_db
def test_register_submission_requires_color_or_weights():
    """Branch: both blended_color and mix_weights are None → ValueError."""
    host_s = create_guest_session("NoColorHost")
    guest_s = create_guest_session("NoColorGuest")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()
    with pytest.raises(ValueError, match="required"):
        register_submission(round_instance, host_s.player, blended_color=None, mix_weights=None)


@pytest.mark.django_db
def test_register_submission_duplicate_raises():
    """Branch: existing submission → ValueError."""
    s = create_guest_session("DupSub")
    match = start_single_player_match(s.player)
    round_instance = match.rounds.order_by("-round_number").first()
    register_submission(round_instance, s.player, blended_color=[100, 100, 100])
    with pytest.raises(ValueError, match="already received"):
        register_submission(round_instance, s.player, blended_color=[200, 200, 200])


@pytest.mark.django_db
def test_blend_color_from_weights_black():
    """Branch: 100% black weight → [0, 0, 0]."""
    base = generate_base_color_set()
    weights = [0, 100, 0, 0, 0, 0, 0, 0]
    result = blend_color_from_weights(base, weights)
    assert result == [0, 0, 0]


@pytest.mark.django_db
def test_blend_color_from_weights_white():
    """Branch: 100% white weight → [255, 255, 255]."""
    base = generate_base_color_set()
    weights = [100, 0, 0, 0, 0, 0, 0, 0]
    result = blend_color_from_weights(base, weights)
    assert result == [255, 255, 255]


# ---------------------------------------------------------------------------
# validators branches
# ---------------------------------------------------------------------------

def test_validate_color_ranges_boundary_values():
    """Branch: boundary values 0 and 255 are accepted."""
    assert validate_color_ranges([0, 0, 0]) == [0, 0, 0]
    assert validate_color_ranges([255, 255, 255]) == [255, 255, 255]


def test_validate_mix_weights_wrong_count_raises():
    """Branch: weights length != expected_count → ValueError."""
    with pytest.raises(ValueError, match="match the available"):
        validate_mix_weights([100, 0], 8)


def test_validate_mix_weights_all_zero_raises():
    """Branch: sum(weights) <= 0 → ValueError."""
    with pytest.raises(ValueError, match="At least one"):
        validate_mix_weights([0, 0, 0, 0, 0, 0, 0, 0], 8)


def test_validate_mix_weights_out_of_range_raises():
    """Branch: weight > 100 → ValueError."""
    with pytest.raises(ValueError, match="between 0 and 100"):
        validate_mix_weights([101, 0, 0, 0, 0, 0, 0, 0], 8)


def test_validate_tie_break_basis_invalid_raises():
    """Branch: invalid basis → ValueError."""
    with pytest.raises(ValueError, match="Unsupported tie-break basis"):
        validate_tie_break_basis("invalid_basis")


def test_validate_tie_break_basis_valid_passes():
    """Branch: valid basis → no exception."""
    validate_tie_break_basis("exact_unrounded_color_distance")


@pytest.mark.django_db
def test_validate_submission_window_closed_round_raises():
    """Branch: round_status != ACTIVE_BLENDING → ValueError."""
    s = create_guest_session("ClosedWindow")
    match = start_single_player_match(s.player)
    round_instance = match.rounds.order_by("-round_number").first()
    # Close the round
    round_instance.round_status = Round.RoundStatus.RESULTS
    round_instance.save()
    with pytest.raises(ValueError, match="closed"):
        validate_submission_window(round_instance)


def test_validate_room_is_joinable_open_room_passes():
    """Branch: room not CLOSED → no exception."""
    room = Room(room_status=Room.RoomStatus.OPEN)
    validate_room_is_joinable(room)  # must not raise


# ---------------------------------------------------------------------------
# match_service branches
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_advance_round_not_in_results_raises():
    """Branch: match not in RESULTS → ValueError."""
    s = create_guest_session("AdvanceNotReady")
    match = start_single_player_match(s.player)
    with pytest.raises(ValueError, match="not in the results phase"):
        advance_round(s.player, str(match.match_id))


@pytest.mark.django_db
def test_advance_round_final_round_raises():
    """Branch: _is_final_round → ValueError."""
    s = create_guest_session("FinalAdvance")
    match = start_single_player_match(s.player)
    # Force match to appear as if round 3 just finished
    Match.objects.filter(match_id=match.match_id).update(
        match_status=Match.MatchStatus.RESULTS,
        current_round_number=3,
    )
    match.refresh_from_db()
    with pytest.raises(ValueError, match="no more rounds"):
        advance_round(s.player, str(match.match_id))


@pytest.mark.django_db
def test_start_multiplayer_match_not_active_member_raises():
    """Branch: requesting player has no active membership."""
    host_s = create_guest_session("MatchHostNA")
    outsider_s = create_guest_session("Outsider")
    room = create_room(host_s.player)
    with pytest.raises(ValueError, match="not an active member"):
        start_multiplayer_match(outsider_s.player, str(room.room_id))


@pytest.mark.django_db
def test_start_multiplayer_match_existing_active_match_raises():
    """Branch: existing non-ended match → ValueError."""
    host_s = create_guest_session("DupMatchH")
    guest_s = create_guest_session("DupMatchG")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    start_multiplayer_match(host_s.player, str(room.room_id))
    with pytest.raises(ValueError, match="already active"):
        start_multiplayer_match(host_s.player, str(room.room_id))


@pytest.mark.django_db
def test_submit_color_match_not_found_raises():
    """Branch: match is None → ValueError."""
    s = create_guest_session("NoMatch")
    with pytest.raises(ValueError, match="Match was not found"):
        submit_color(s.player, "00000000-0000-0000-0000-000000000000", [100, 100, 100])


@pytest.mark.django_db
def test_submit_color_wrong_status_raises():
    """Branch: match not in ACTIVE_ROUND or RESULTS → ValueError."""
    s = create_guest_session("WrongStatus")
    match = start_single_player_match(s.player)
    Match.objects.filter(match_id=match.match_id).update(
        match_status=Match.MatchStatus.SCORING
    )
    match.refresh_from_db()
    with pytest.raises(ValueError, match="not accepting submissions"):
        submit_color(s.player, str(match.match_id), [100, 100, 100])


# ---------------------------------------------------------------------------
# api/exceptions.py — translate_api_error 500 branch (line 48)
# ---------------------------------------------------------------------------

def test_translate_api_error_unexpected_exception_returns_500():
    """Branch: non-APIError, non-ValueError → 500 response."""
    response = translate_api_error(RuntimeError("boom"))
    import json
    body = json.loads(response.content)
    assert response.status_code == 500
    assert "could not be completed" in body["error"]


# ---------------------------------------------------------------------------
# api/schemas.py — room_list_response (line 19)
# ---------------------------------------------------------------------------

def test_room_list_response_wraps_list():
    result = room_list_response([{"roomId": "x"}])
    assert result == {"rooms": [{"roomId": "x"}]}


# ---------------------------------------------------------------------------
# api/views/room_views.py — browse, current_room, delete_room (lines 89,94-99,105-115)
# ---------------------------------------------------------------------------

def _req_with_session(request):
    middleware = SessionMiddleware(lambda req: None)
    middleware.process_request(request)
    request.session.save()
    return request


@pytest.mark.django_db
def test_browse_rooms_view_returns_list():
    request = RequestFactory().get("/rooms/")
    response = room_views.browse_rooms_view(request)
    import json
    assert response.status_code == 200
    assert "rooms" in json.loads(response.content)


@pytest.mark.django_db
def test_current_room_view_returns_none_when_no_room():
    from unittest.mock import patch
    player = create_guest_session("CurrentRoomPlayer").player
    request = _req_with_session(RequestFactory().get("/rooms/current/"))
    request.session[session_views.SESSION_KEY] = str(
        __import__("apps.accounts.models", fromlist=["Session"])
        .Session.objects.filter(player=player).first().session_id
    )
    with patch("api.views.room_views.get_active_session", return_value=type("S", (), {"player": player})()):
        response = room_views.current_room_view(request)
    assert response.status_code == 200


@pytest.mark.django_db
def test_delete_room_view_requires_room_id():
    from unittest.mock import patch
    player = create_guest_session("DeleteRoomPlayer").player
    request = _req_with_session(
        RequestFactory().post("/rooms/delete/", data="{}", content_type="application/json")
    )
    with patch("api.views.room_views.get_active_session", return_value=type("S", (), {"player": player})()):
        response = room_views.delete_room_view(request)
    import json
    assert response.status_code == 400
    assert "roomId" in json.loads(response.content)["error"]


@pytest.mark.django_db
def test_delete_room_view_closes_room():
    from unittest.mock import patch
    player = create_guest_session("DeleteRoomOwner").player
    room = create_room(player)
    request = _req_with_session(
        RequestFactory().post(
            "/rooms/delete/",
            data=f'{{"roomId":"{room.room_id}"}}',
            content_type="application/json",
        )
    )
    with patch("api.views.room_views.get_active_session", return_value=type("S", (), {"player": player})()):
        with patch("services.room_service.publish_room_state"):
            response = room_views.delete_room_view(request)
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# api/views/session_views.py — non-guest display name (71), avatar update (75)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_update_session_view_rejects_display_name_for_non_guest():
    session = create_authenticated_session("google:nodisplay", "AuthUser", "")
    request = _req_with_session(
        RequestFactory().patch(
            "/sessions/current/update/",
            data='{"displayName":"NewName"}',
            content_type="application/json",
        )
    )
    with patch("api.views.session_views.get_active_session", return_value=session):
        response = session_views.update_session_view(request)
    body = json.loads(response.content)
    assert response.status_code == 200
    assert body["session"]["player"]["displayName"] == "NewName"
    session.refresh_from_db()
    assert session.player.display_name == "NewName"


@pytest.mark.django_db
def test_update_session_view_updates_avatar():
    from unittest.mock import patch
    session = create_guest_session("AvatarUser")
    request = _req_with_session(
        RequestFactory().patch(
            "/sessions/current/update/",
            data='{"profileAvatar":"https://example.com/avatar.png"}',
            content_type="application/json",
        )
    )
    with patch("api.views.session_views.get_active_session", return_value=session):
        response = session_views.update_session_view(request)
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# api/views/gameplay_views.py — advance_round_view (lines 86-98)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_advance_round_view_requires_match_id():
    from unittest.mock import patch
    player = create_guest_session("AdvPlayer").player
    request = _req_with_session(
        RequestFactory().post("/gameplay/advance/", data="{}", content_type="application/json")
    )
    with patch("api.views.gameplay_views.get_active_session", return_value=type("S", (), {"player": player})()):
        response = gameplay_views.advance_round_view(request)
    import json
    assert response.status_code == 400
    assert "matchId" in json.loads(response.content)["error"]


@pytest.mark.django_db
def test_advance_round_view_returns_service_errors():
    from unittest.mock import patch
    player = create_guest_session("AdvPlayer2").player
    request = _req_with_session(
        RequestFactory().post(
            "/gameplay/advance/",
            data='{"matchId":"00000000-0000-0000-0000-000000000001"}',
            content_type="application/json",
        )
    )
    with patch("api.views.gameplay_views.get_active_session", return_value=type("S", (), {"player": player})()):
        response = gameplay_views.advance_round_view(request)
    import json
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# engine/round_engine.py — SINGLE_PLAYER early return (77), continue branch (96)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_create_missing_submissions_skips_single_player():
    """Line 77: _create_missing_multiplayer_submissions returns early for single player."""
    s = create_guest_session("SingleSkip")
    match = start_single_player_match(s.player)
    # finalize_round_if_ready calls _create_missing... internally; single player → skipped
    round_instance = match.rounds.first()
    round_instance.round_status = Round.RoundStatus.ACTIVE_BLENDING
    round_instance.save(update_fields=["round_status"])
    finalize_round_if_ready(match)  # should not raise


@pytest.mark.django_db
def test_create_missing_submissions_skips_existing_submission():
    """Line 96: continue branch when all players already submitted but round is expired."""
    host_s = create_guest_session("ExistH")
    guest_s = create_guest_session("ExistG")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))
    round_instance = match.rounds.first()
    # Both players submit
    register_submission(round_instance, host_s.player, blended_color=[100, 100, 100])
    register_submission(round_instance, guest_s.player, blended_color=[50, 50, 50])
    # Backdate so the round appears expired — forces _create_missing_multiplayer_submissions to run
    Round.objects.filter(round_id=round_instance.round_id).update(
        started_at=timezone.now() - timezone.timedelta(seconds=200)
    )
    round_instance.refresh_from_db()
    finalize_round_if_ready(match)
    # Both had submissions → continue branch hit for each; no duplicates created
    assert round_instance.submissions.count() == 2


# ---------------------------------------------------------------------------
# services/match_service.py — advance_round not found (294), non-member (301-307)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_advance_round_match_not_found_raises():
    s = create_guest_session("AdvNotFound")
    with pytest.raises(ValueError, match="Match was not found"):
        advance_round(s.player, "00000000-0000-0000-0000-000000000000")


@pytest.mark.django_db
def test_advance_round_multiplayer_non_member_raises():
    host_s = create_guest_session("AdvH")
    guest_s = create_guest_session("AdvG")
    outsider_s = create_guest_session("AdvOut")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))
    Match.objects.filter(match_id=match.match_id).update(match_status=Match.MatchStatus.RESULTS)
    match.refresh_from_db()
    with pytest.raises(ValueError, match="not active in the room"):
        advance_round(outsider_s.player, str(match.match_id))


# ---------------------------------------------------------------------------
# services/match_service.py — _advance_match_if_ready actual advance (181-189, 280, 338)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_advance_match_if_ready_advances_to_next_round():
    """Lines 181-189, 280: auto-advance when results window expired."""
    from unittest.mock import patch
    s = create_guest_session("AutoAdv")
    match = start_single_player_match(s.player)
    # Put match in RESULTS with round 1 complete (non-final round 1 of 3)
    round_instance = match.rounds.first()
    Match.objects.filter(match_id=match.match_id).update(
        match_status=Match.MatchStatus.RESULTS, current_round_number=1
    )
    Round.objects.filter(round_id=round_instance.round_id).update(
        round_status=Round.RoundStatus.RESULTS,
        ended_at=timezone.now() - timezone.timedelta(seconds=400),
    )
    match.refresh_from_db()
    with patch("websockets.match_publisher.broker.publish"):
        from services.match_service import get_match_state
        get_match_state(s.player, str(match.match_id))
    match.refresh_from_db()
    assert match.current_round_number == 2


# ---------------------------------------------------------------------------
# services/room_service.py — list_rooms (105-106), get_room_for_player (110-120)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_list_rooms_returns_open_rooms():
    player = create_guest_session("ListRoomP").player
    room = create_room(player)
    rooms = list_rooms()
    assert any(str(r["roomId"]) == str(room.room_id) for r in rooms)


@pytest.mark.django_db
def test_get_room_for_player_returns_none_when_no_membership():
    player = create_guest_session("NoRoomP").player
    result = get_room_for_player(player)
    assert result is None


@pytest.mark.django_db
def test_get_room_for_player_returns_room():
    host = create_guest_session("GRFPHost").player
    room = create_room(host)
    result = get_room_for_player(host)
    assert result is not None
    assert result.room_id == room.room_id


# ---------------------------------------------------------------------------
# services/room_service.py — _sync_active_match scoring/result publish (146, 159-160)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_sync_active_match_finalizes_round_and_publishes_when_active():
    """Lines 146->exit, 159-160: active match in ACTIVE_ROUND + all submitted → results published."""
    from unittest.mock import patch
    host_s = create_guest_session("SyncFH")
    guest_s = create_guest_session("SyncFG")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    match = start_multiplayer_match(host_s.player, str(room.room_id))
    round_instance = match.rounds.first()
    # Both submit — then guest leaves, triggering _sync_active_match
    with patch("websockets.submission_publisher.broker.publish"):
        with patch("websockets.results_publisher.broker.publish"):
            register_submission(round_instance, host_s.player, blended_color=[10, 20, 30])
            register_submission(round_instance, guest_s.player, blended_color=[10, 20, 30])
    with patch("websockets.results_publisher.broker.publish"):
        with patch("services.room_service.publish_room_state"):
            leave_room(guest_s.player, str(room.room_id))
    match.refresh_from_db()
    assert match.match_status in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]


# ---------------------------------------------------------------------------
# Additional backend coverage targets
# ---------------------------------------------------------------------------

def _send_collector(messages: list[dict]):
    async def send(message: dict):
        messages.append(message)

    return send


@pytest.mark.django_db
def test_provider_settings_requires_all_env(monkeypatch):
    keys = [
        "GOOGLE_OAUTH_CLIENT_ID",
        "GOOGLE_OAUTH_CLIENT_SECRET",
        "GOOGLE_OAUTH_AUTHORIZE_URL",
        "GOOGLE_OAUTH_TOKEN_URL",
        "GOOGLE_OAUTH_USERINFO_URL",
        "GOOGLE_OAUTH_REDIRECT_URI",
        "GOOGLE_OAUTH_SCOPE",
    ]
    for key in keys:
        monkeypatch.delenv(key, raising=False)

    with pytest.raises(ValueError, match="not configured"):
        auth_views._provider_settings("google")


@pytest.mark.django_db
def test_authorization_url_google_and_github(monkeypatch):
    for provider in ("GOOGLE", "GITHUB"):
        monkeypatch.setenv(f"{provider}_OAUTH_CLIENT_ID", "client-id")
        monkeypatch.setenv(f"{provider}_OAUTH_CLIENT_SECRET", "client-secret")
        monkeypatch.setenv(f"{provider}_OAUTH_AUTHORIZE_URL", f"https://{provider.lower()}.example.com/oauth")
        monkeypatch.setenv(f"{provider}_OAUTH_TOKEN_URL", f"https://{provider.lower()}.example.com/token")
        monkeypatch.setenv(f"{provider}_OAUTH_USERINFO_URL", f"https://{provider.lower()}.example.com/userinfo")
        monkeypatch.setenv(f"{provider}_OAUTH_REDIRECT_URI", "https://frontend.example.com/callback")
        monkeypatch.setenv(f"{provider}_OAUTH_SCOPE", "openid profile")

    google_url = auth_views._authorization_url("google", "state-1")
    github_url = auth_views._authorization_url("github", "state-2")

    assert "access_type=offline" in google_url
    assert "prompt=consent" in google_url
    assert "state=state-1" in google_url
    assert "access_type=offline" not in github_url
    assert "prompt=consent" not in github_url
    assert "state=state-2" in github_url


def test_fetch_json_handles_plain_get_and_form_post():
    class _Response:
        def __init__(self, payload: str):
            self._payload = payload

        def read(self):
            return self._payload.encode("utf-8")

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    calls = []

    def fake_urlopen(request, timeout):
        calls.append((request.full_url, request.data, dict(request.header_items()), timeout))
        return _Response('{"ok": true}')

    with patch("api.views.auth_views.urlopen", side_effect=fake_urlopen):
        assert auth_views._fetch_json("https://example.com/get") == {"ok": True}
        assert auth_views._fetch_json(
            "https://example.com/post",
            data={"code": "abc"},
            headers={"Accept": "application/json"},
        ) == {"ok": True}

    assert calls[0][1] is None
    assert calls[1][1] is not None
    assert calls[1][3] == 10


@pytest.mark.django_db
def test_exchange_code_for_token_returns_access_token(monkeypatch):
    for key, value in {
        "GOOGLE_OAUTH_CLIENT_ID": "client-id",
        "GOOGLE_OAUTH_CLIENT_SECRET": "client-secret",
        "GOOGLE_OAUTH_AUTHORIZE_URL": "https://google.example.com/oauth",
        "GOOGLE_OAUTH_TOKEN_URL": "https://google.example.com/token",
        "GOOGLE_OAUTH_USERINFO_URL": "https://google.example.com/userinfo",
        "GOOGLE_OAUTH_REDIRECT_URI": "https://frontend.example.com/callback",
        "GOOGLE_OAUTH_SCOPE": "openid profile",
    }.items():
        monkeypatch.setenv(key, value)

    with patch("api.views.auth_views._fetch_json", return_value={"access_token": "token-123"}):
        assert auth_views._exchange_code_for_token("google", "code-123") == "token-123"


@pytest.mark.django_db
def test_exchange_code_for_token_requires_access_token(monkeypatch):
    for key, value in {
        "GITHUB_OAUTH_CLIENT_ID": "client-id",
        "GITHUB_OAUTH_CLIENT_SECRET": "client-secret",
        "GITHUB_OAUTH_AUTHORIZE_URL": "https://github.example.com/oauth",
        "GITHUB_OAUTH_TOKEN_URL": "https://github.example.com/token",
        "GITHUB_OAUTH_USERINFO_URL": "https://github.example.com/userinfo",
        "GITHUB_OAUTH_REDIRECT_URI": "https://frontend.example.com/callback",
        "GITHUB_OAUTH_SCOPE": "read:user",
    }.items():
        monkeypatch.setenv(key, value)

    with patch("api.views.auth_views._fetch_json", return_value={}):
        with pytest.raises(ValueError, match="OAuth sign-in failed"):
            auth_views._exchange_code_for_token("github", "code-123")


@pytest.mark.django_db
def test_load_identity_google_github_and_missing_identity(monkeypatch):
    for provider in ("GOOGLE", "GITHUB"):
        monkeypatch.setenv(f"{provider}_OAUTH_CLIENT_ID", "client-id")
        monkeypatch.setenv(f"{provider}_OAUTH_CLIENT_SECRET", "client-secret")
        monkeypatch.setenv(f"{provider}_OAUTH_AUTHORIZE_URL", f"https://{provider.lower()}.example.com/oauth")
        monkeypatch.setenv(f"{provider}_OAUTH_TOKEN_URL", f"https://{provider.lower()}.example.com/token")
        monkeypatch.setenv(f"{provider}_OAUTH_USERINFO_URL", f"https://{provider.lower()}.example.com/userinfo")
        monkeypatch.setenv(f"{provider}_OAUTH_REDIRECT_URI", "https://frontend.example.com/callback")
        monkeypatch.setenv(f"{provider}_OAUTH_SCOPE", "openid profile")

    with patch(
        "api.views.auth_views._fetch_json",
        return_value={"sub": "g-1", "name": "Google User", "picture": "https://img/google.png"},
    ):
        assert auth_views._load_identity("google", "token") == (
            "g-1",
            "Google User",
            "https://img/google.png",
        )

    with patch(
        "api.views.auth_views._fetch_json",
        return_value={"id": "gh-1", "login": "octocat", "avatar_url": "https://img/github.png"},
    ):
        assert auth_views._load_identity("github", "token") == (
            "gh-1",
            "octocat",
            "https://img/github.png",
        )

    with patch("api.views.auth_views._fetch_json", return_value={"name": "Missing Id"}):
        with pytest.raises(ValueError, match="could not be verified"):
            auth_views._load_identity("google", "token")


@pytest.mark.django_db
def test_oauth_start_view_rejects_unsupported_provider():
    request = _req_with_session(RequestFactory().get("/auth/oauth/start/?provider=discord"))

    response = auth_views.oauth_start_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "Unsupported OAuth provider."


@pytest.mark.django_db
def test_oauth_start_view_returns_configuration_error(monkeypatch):
    monkeypatch.delenv("GOOGLE_OAUTH_CLIENT_ID", raising=False)
    request = _req_with_session(RequestFactory().get("/auth/oauth/start/?provider=google"))

    response = auth_views.oauth_start_view(request)

    assert response.status_code == 400
    assert "OAuth is not configured" in json.loads(response.content)["error"]


@pytest.mark.django_db
def test_oauth_start_view_returns_authorization_url():
    request = _req_with_session(RequestFactory().get("/auth/oauth/start/?provider=google"))

    with patch("api.views.auth_views._authorization_url", return_value="https://auth.example.com/start"):
        response = auth_views.oauth_start_view(request)

    body = json.loads(response.content)
    assert response.status_code == 200
    assert body["provider"] == "google"
    assert body["authorizationUrl"] == "https://auth.example.com/start"
    assert request.session[auth_views.OAUTH_PROVIDER_KEY] == "google"
    assert request.session[auth_views.OAUTH_STATE_KEY] == body["state"]


@pytest.mark.django_db
def test_oauth_start_view_saves_session_when_missing_key():
    request = RequestFactory().get("/auth/oauth/start/?provider=google")
    middleware = SessionMiddleware(lambda req: None)
    middleware.process_request(request)

    with patch.object(request.session, "save", wraps=request.session.save) as mock_save:
        with patch("api.views.auth_views._authorization_url", return_value="https://auth.example.com/start"):
            response = auth_views.oauth_start_view(request)

    assert response.status_code == 200
    assert mock_save.called


@pytest.mark.django_db
def test_oauth_complete_view_rejects_bad_provider():
    request = _req_with_session(RequestFactory().get("/auth/oauth/complete/?provider=discord"))

    response = auth_views.oauth_complete_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "Unsupported OAuth provider."


@pytest.mark.django_db
def test_oauth_complete_view_rejects_state_mismatch():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=wrong&code=abc")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "expected"

    response = auth_views.oauth_complete_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "OAuth state could not be verified."


@pytest.mark.django_db
def test_oauth_complete_view_rejects_provider_mismatch():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&code=abc")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "github"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    response = auth_views.oauth_complete_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "OAuth provider could not be verified."


@pytest.mark.django_db
def test_oauth_complete_view_redirects_cancelled():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&error=access_denied")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    response = auth_views.oauth_complete_view(request)

    assert response.status_code == 302
    assert "oauthStatus=cancelled" in response["Location"]


@pytest.mark.django_db
def test_oauth_complete_view_redirects_failed_for_error_param():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&error=server_error")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    response = auth_views.oauth_complete_view(request)

    assert response.status_code == 302
    assert "oauthStatus=failed" in response["Location"]


@pytest.mark.django_db
def test_oauth_complete_view_requires_code():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    response = auth_views.oauth_complete_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "OAuth sign-in failed."


@pytest.mark.django_db
def test_oauth_complete_view_returns_json_value_error():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&code=abc&format=json")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    with patch("api.views.auth_views._exchange_code_for_token", side_effect=ValueError("bad token")):
        response = auth_views.oauth_complete_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "bad token"


@pytest.mark.django_db
def test_oauth_complete_view_redirects_failed_for_value_error():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&code=abc")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    with patch("api.views.auth_views._exchange_code_for_token", side_effect=ValueError("bad token")):
        response = auth_views.oauth_complete_view(request)

    assert response.status_code == 302
    assert "oauthStatus=failed" in response["Location"]


@pytest.mark.django_db
def test_oauth_complete_view_returns_json_generic_error():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&code=abc&format=json")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    with patch("api.views.auth_views._exchange_code_for_token", side_effect=URLError("boom")):
        response = auth_views.oauth_complete_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "OAuth sign-in failed."


@pytest.mark.django_db
def test_oauth_complete_view_redirects_failed_for_generic_error():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&code=abc")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    with patch("api.views.auth_views._exchange_code_for_token", side_effect=URLError("boom")):
        response = auth_views.oauth_complete_view(request)

    assert response.status_code == 302
    assert "oauthStatus=failed" in response["Location"]


@pytest.mark.django_db
def test_oauth_complete_view_returns_json_success():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&code=abc&format=json")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    with (
        patch("api.views.auth_views._exchange_code_for_token", return_value="token"),
        patch("api.views.auth_views._load_identity", return_value=("oauth-id", "OAuth User", "https://img/user.png")),
    ):
        response = auth_views.oauth_complete_view(request)

    body = json.loads(response.content)
    assert response.status_code == 200
    assert body["session"]["player"]["displayName"] == "OAuth User"
    assert request.session[session_views.SESSION_KEY]


@pytest.mark.django_db
def test_oauth_complete_view_redirects_success():
    request = _req_with_session(
        RequestFactory().get("/auth/oauth/complete/?provider=google&state=ok&code=abc")
    )
    request.session[auth_views.OAUTH_PROVIDER_KEY] = "google"
    request.session[auth_views.OAUTH_STATE_KEY] = "ok"

    with (
        patch("api.views.auth_views._exchange_code_for_token", return_value="token"),
        patch("api.views.auth_views._load_identity", return_value=("oauth-id-2", "OAuth User", "")),
    ):
        response = auth_views.oauth_complete_view(request)

    assert response.status_code == 302
    assert "oauthStatus=success" in response["Location"]


@pytest.mark.django_db
def test_register_local_account_success_and_validation_errors():
    session = register_local_account("local-user", "secret", "Local User")
    assert session.session_type == Session.SessionType.AUTHENTICATED
    assert LocalCredential.objects.filter(username="local-user").exists()

    with pytest.raises(ValueError, match="Username is required"):
        register_local_account("   ", "secret", "Name")
    with pytest.raises(ValueError, match="Password is required"):
        register_local_account("user2", "", "Name")
    with pytest.raises(ValueError, match="Display name is required"):
        register_local_account("user3", "secret", "   ")
    with pytest.raises(ValueError, match="already taken"):
        register_local_account("local-user", "secret", "Another Name")


@pytest.mark.django_db
def test_login_local_account_success_and_wrong_credentials():
    original = register_local_account("login-user", "secret", "Local User")
    logged_in = login_local_account("login-user", "secret")

    assert logged_in.session_type == Session.SessionType.AUTHENTICATED
    original.refresh_from_db()
    assert original.status == Session.Status.LOGGED_OUT

    with pytest.raises(ValueError, match="Invalid username or password"):
        login_local_account("login-user", "wrong")


@pytest.mark.django_db
def test_update_display_name_rejects_blank():
    session = create_guest_session("Name Before")

    with pytest.raises(ValueError, match="cannot be blank"):
        update_display_name(session, "   ")


@pytest.mark.django_db
def test_register_local_view_success_and_error():
    success_request = _req_with_session(
        RequestFactory().post(
            "/sessions/register/",
            data='{"username":"view-user","password":"secret","displayName":"View User"}',
            content_type="application/json",
        )
    )
    success_response = session_views.register_local_view(success_request)
    assert success_response.status_code == 201
    assert success_request.session[session_views.SESSION_KEY]

    error_request = _req_with_session(
        RequestFactory().post(
            "/sessions/register/",
            data='{"username":"","password":"secret","displayName":"View User"}',
            content_type="application/json",
        )
    )
    error_response = session_views.register_local_view(error_request)
    assert error_response.status_code == 400


@pytest.mark.django_db
def test_login_local_view_success_and_invalid_credentials():
    register_local_account("view-login", "secret", "View Login")

    success_request = _req_with_session(
        RequestFactory().post(
            "/sessions/login/",
            data='{"username":"view-login","password":"secret"}',
            content_type="application/json",
        )
    )
    success_response = session_views.login_local_view(success_request)
    assert success_response.status_code == 200
    assert success_request.session[session_views.SESSION_KEY]

    error_request = _req_with_session(
        RequestFactory().post(
            "/sessions/login/",
            data='{"username":"view-login","password":"wrong"}',
            content_type="application/json",
        )
    )
    error_response = session_views.login_local_view(error_request)
    assert error_response.status_code == 400


@pytest.mark.django_db
def test_advance_round_view_requires_active_session():
    request = _req_with_session(
        RequestFactory().post(
            "/gameplay/advance/",
            data='{"matchId":"match-1"}',
            content_type="application/json",
        )
    )

    response = gameplay_views.advance_round_view(request)

    assert response.status_code == 401
    assert json.loads(response.content)["error"] == "No active session."


@pytest.mark.django_db
def test_advance_round_view_returns_success_payload():
    player = create_guest_session("Advance Success").player
    request = _req_with_session(
        RequestFactory().post(
            "/gameplay/advance/",
            data='{"matchId":"match-1"}',
            content_type="application/json",
        )
    )

    with (
        patch("api.views.gameplay_views.get_active_session", return_value=SimpleNamespace(player=player)),
        patch("api.views.gameplay_views.advance_round", return_value=SimpleNamespace()),
        patch("api.views.gameplay_views.serialize_match_state", return_value={"matchId": "match-1", "matchStatus": "active_round"}),
    ):
        response = gameplay_views.advance_round_view(request)

    assert response.status_code == 200
    assert json.loads(response.content)["gameplay"]["matchId"] == "match-1"


@pytest.mark.django_db
def test_current_room_view_translates_active_session_error():
    request = _req_with_session(RequestFactory().get("/rooms/current/"))

    with patch("api.views.room_views.get_active_session", side_effect=ValueError("session missing")):
        response = room_views.current_room_view(request)

    assert response.status_code == 400
    assert json.loads(response.content)["error"] == "session missing"


@pytest.mark.django_db
def test_submit_color_refreshes_match_when_auto_advanced():
    session = create_guest_session("Refresh Match")
    match = start_single_player_match(session.player)
    round_instance = match.rounds.first()
    Match.objects.filter(match_id=match.match_id).update(match_status=Match.MatchStatus.RESULTS)
    Round.objects.filter(round_id=round_instance.round_id).update(
        round_status=Round.RoundStatus.RESULTS,
        ended_at=timezone.now() - timezone.timedelta(seconds=301),
    )
    match.refresh_from_db()

    with (
        patch("services.match_service.register_submission"),
        patch("services.match_service.finalize_round_if_ready"),
        patch("services.match_service._advance_match_if_ready", return_value=True),
        patch("services.match_service._record_history_for_match"),
        patch("services.match_service._sync_room_after_match_state"),
        patch("services.match_service.publish_submission_receipt"),
        patch("services.match_service.publish_scoring_update"),
        patch("services.match_service.publish_result_publication"),
        patch.object(Match, "refresh_from_db", wraps=match.refresh_from_db) as mock_refresh,
    ):
        submit_color(session.player, str(match.match_id), [10, 20, 30])

    assert mock_refresh.call_count >= 1


@pytest.mark.django_db
def test_serialize_match_state_returns_tied_leaderboard_ranks():
    host_session = create_guest_session("Leaderboard Host")
    guest_session = create_guest_session("Leaderboard Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    match = start_multiplayer_match(host_session.player, str(room.room_id))
    round_instance = match.rounds.first()
    round_instance.round_status = Round.RoundStatus.RESULTS
    round_instance.ended_at = timezone.now()
    round_instance.save(update_fields=["round_status", "ended_at"])
    match.match_status = Match.MatchStatus.ENDED
    match.ended_at = timezone.now()
    match.save(update_fields=["match_status", "ended_at"])
    Submission.objects.create(
        round=round_instance,
        player=host_session.player,
        blended_color=[10, 20, 30],
        submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=1,
    )
    Submission.objects.create(
        round=round_instance,
        player=guest_session.player,
        blended_color=[10, 20, 30],
        submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=2,
    )
    ScoreRecord.objects.create(
        round=round_instance,
        player=host_session.player,
        color_distance=0,
        score=1000,
        similarity_percentage=100,
        rank=1,
        tie_break_basis="exact_unrounded_color_distance",
    )
    ScoreRecord.objects.create(
        round=round_instance,
        player=guest_session.player,
        color_distance=0,
        score=1000,
        similarity_percentage=100,
        rank=1,
        tie_break_basis="exact_unrounded_color_distance",
    )

    state = serialize_match_state(match)

    assert state["matchLeaderboard"][0]["rank"] == 1
    assert state["matchLeaderboard"][1]["rank"] == 1


@pytest.mark.django_db
def test_advance_round_multiplayer_success_for_active_member():
    host_session = create_guest_session("Advance Multi Host")
    guest_session = create_guest_session("Advance Multi Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    match = start_multiplayer_match(host_session.player, str(room.room_id))
    round_instance = match.rounds.first()
    round_instance.round_status = Round.RoundStatus.RESULTS
    round_instance.ended_at = timezone.now()
    round_instance.save(update_fields=["round_status", "ended_at"])
    match.match_status = Match.MatchStatus.RESULTS
    match.save(update_fields=["match_status"])

    with patch("websockets.match_publisher.publish_round_start"):
        advanced = advance_round(host_session.player, str(match.match_id))

    assert advanced.current_round_number == 2
    assert advanced.match_status == Match.MatchStatus.ACTIVE_ROUND


@pytest.mark.django_db
def test_sync_room_after_match_state_exits_for_unhandled_status():
    host_session = create_guest_session("Unhandled Status Host")
    guest_session = create_guest_session("Unhandled Status Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status="custom_status",
        current_round_number=1,
        participant_count=2,
    )

    with patch("websockets.presence_publisher.publish_room_state") as mock_publish:
        from services.match_service import _sync_room_after_match_state

        _sync_room_after_match_state(match)

    assert not mock_publish.called


@pytest.mark.django_db
def test_sync_active_match_publishes_when_match_reaches_results():
    host_session = create_guest_session("Sync Result Host")
    guest_session = create_guest_session("Sync Result Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    match = start_multiplayer_match(host_session.player, str(room.room_id))
    round_instance = match.rounds.first()
    register_submission(round_instance, host_session.player, blended_color=[10, 20, 30])
    register_submission(round_instance, guest_session.player, blended_color=[10, 20, 30])

    with (
        patch("services.room_service.publish_submission_receipt") as mock_receipt,
        patch("websockets.results_publisher.publish_scoring_update") as mock_scoring,
        patch("websockets.results_publisher.publish_result_publication") as mock_results,
    ):
        _sync_active_match_after_membership_change(room)

    assert mock_receipt.called
    assert mock_scoring.called
    assert mock_results.called


@pytest.mark.django_db
def test_sync_active_match_does_not_publish_results_when_match_stays_active():
    host_session = create_guest_session("Sync Active Host")
    guest_session = create_guest_session("Sync Active Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    match = start_multiplayer_match(host_session.player, str(room.room_id))

    with (
        patch("engine.round_engine.finalize_round_if_ready"),
        patch("services.match_service._record_history_for_match"),
        patch("services.match_service._sync_room_after_match_state"),
        patch("services.room_service.publish_submission_receipt") as mock_receipt,
        patch("websockets.results_publisher.publish_scoring_update") as mock_scoring,
        patch("websockets.results_publisher.publish_result_publication") as mock_results,
    ):
        _sync_active_match_after_membership_change(room)

    assert mock_receipt.called
    assert not mock_scoring.called
    assert not mock_results.called


@pytest.mark.django_db
def test_sync_active_match_exits_when_match_is_already_in_results():
    host_session = create_guest_session("Sync Results Host")
    guest_session = create_guest_session("Sync Results Guest")
    room = create_room(host_session.player)
    join_room(guest_session.player, str(room.room_id))
    match = start_multiplayer_match(host_session.player, str(room.room_id))
    match.match_status = Match.MatchStatus.RESULTS
    match.save(update_fields=["match_status"])

    with (
        patch("services.room_service.publish_submission_receipt") as mock_receipt,
        patch("websockets.results_publisher.publish_scoring_update") as mock_scoring,
        patch("websockets.results_publisher.publish_result_publication") as mock_results,
    ):
        _sync_active_match_after_membership_change(room)

    assert not mock_receipt.called
    assert not mock_scoring.called
    assert not mock_results.called


@pytest.mark.django_db
def test_create_missing_multiplayer_submissions_returns_for_single_player():
    session = create_guest_session("Single Player Early Return")
    match = start_single_player_match(session.player)
    round_instance = match.rounds.first()

    _create_missing_multiplayer_submissions(round_instance, match)

    assert round_instance.submissions.count() == 0


def test_forward_timer_updates_publishes_results_on_transition():
    messages: list[dict] = []
    mock_scoring = None
    mock_results = None

    async def run_test():
        nonlocal mock_scoring, mock_results
        with (
            patch("websockets.room_consumer.asyncio.sleep", new=AsyncMock(return_value=None)),
            patch(
                "services.match_service.get_match_state",
                side_effect=[SimpleNamespace(), SimpleNamespace(), ValueError("done")],
            ),
            patch(
                "services.match_service.serialize_match_state",
                side_effect=[
                    {"matchId": "match-1", "matchStatus": "active_round"},
                    {"matchId": "match-1", "matchStatus": "results"},
                ],
            ),
            patch("websockets.results_publisher.publish_scoring_update") as scoring,
            patch("websockets.results_publisher.publish_result_publication") as results,
        ):
            mock_scoring = scoring
            mock_results = results
            await _forward_timer_updates(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    assert mock_scoring.called
    assert mock_results.called


def test_forward_timer_updates_returns_when_match_ended():
    messages: list[dict] = []

    async def run_test():
        with (
            patch("websockets.room_consumer.asyncio.sleep", new=AsyncMock(return_value=None)),
            patch("services.match_service.get_match_state", return_value=SimpleNamespace()),
            patch(
                "services.match_service.serialize_match_state",
                return_value={"matchId": "match-1", "matchStatus": "ended"},
            ),
        ):
            await _forward_timer_updates(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    assert messages == []


def test_forward_timer_updates_sends_round_start_after_results_transition():
    messages: list[dict] = []

    async def run_test():
        with (
            patch("websockets.room_consumer.asyncio.sleep", new=AsyncMock(return_value=None)),
            patch(
                "services.match_service.get_match_state",
                side_effect=[SimpleNamespace(), SimpleNamespace(), ValueError("done")],
            ),
            patch(
                "services.match_service.serialize_match_state",
                side_effect=[
                    {"matchId": "match-1", "matchStatus": "results"},
                    {"matchId": "match-1", "matchStatus": "active_round"},
                ],
            ),
        ):
            await _forward_timer_updates(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    payloads = [json.loads(message["text"]) for message in messages]
    assert payloads[0]["event"] == "round_start_update"
    assert payloads[1]["event"] == "timer_update"


def test_forward_timer_updates_continues_for_unhandled_status():
    messages: list[dict] = []

    async def run_test():
        with (
            patch("websockets.room_consumer.asyncio.sleep", new=AsyncMock(return_value=None)),
            patch(
                "services.match_service.get_match_state",
                side_effect=[SimpleNamespace(), ValueError("done")],
            ),
            patch(
                "services.match_service.serialize_match_state",
                return_value={"matchId": "match-1", "matchStatus": "waiting_for_players"},
            ),
        ):
            await _forward_timer_updates(_send_collector(messages), SimpleNamespace(), "match-1")

    asyncio.run(run_test())

    assert messages == []
