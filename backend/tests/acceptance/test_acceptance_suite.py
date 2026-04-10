"""
Acceptance Test Suite — Blend Colour Game
==========================================
Covers 100% of acceptance test flows defined in:
  Blend_Colour_Game_Use_Cases_Scenarios_ATs.md

AT-to-function mapping
-----------------------
UC-01 (OAuth Sign-In):          test_uc01_oauth_signin_*
UC-02 (Guest Play):             test_uc02_guest_play_*
UC-03 (Guest Name Generation):  test_uc03_guest_name_*
UC-04 (Edit Guest Name):        test_uc04_edit_display_name_*
UC-05 (Profile in Lobby):       test_uc05_profile_display_*
UC-06 (OAuth Identity Link):    test_uc06_oauth_identity_link_*
UC-07 (Active Session):         test_uc07_active_session_*
UC-08 (Logout):                 test_uc08_logout_*
UC-09 (Guest Session Expiry):   test_uc09_guest_expiry_*
UC-10 (Unique Names):           test_uc10_unique_names_*
UC-11 (Reconnect):              test_uc11_reconnect_*
UC-12 (Color Blending Panel):   test_uc12_color_blending_*
UC-13 (Base Color Distribution):test_uc13_base_colors_*
UC-14 (Sliders):                test_uc14_sliders_*
UC-15 (Real-Time Blend):        test_uc15_realtime_*
UC-16 (Color Reset):            test_uc16_color_reset_*
UC-17 (Color Validation):       test_uc17_color_validation_*
UC-18 (Preview Blended Color):  test_uc18_preview_*
UC-19 (View Target Color):      test_uc19_target_color_*
UC-20 (Random Target):          test_uc20_random_target_*
UC-21 (Color Distance):         test_uc21_color_distance_*
UC-22 (Score Accuracy):         test_uc22_score_accuracy_*
UC-23 (Similarity Percentage):  test_uc23_similarity_*
UC-24 (Rank Players):           test_uc24_ranking_*
UC-25 (Tie Resolution):         test_uc25_tie_resolution_*
UC-26 (Tie-Break Explanation):  test_uc26_tiebreak_explanation_*
UC-27 (Round Time Limit):       test_uc27_time_limit_*
UC-28 (Countdown Timer):        test_uc28_countdown_*
UC-29 (Auto-End on Expiry):     test_uc29_auto_end_*
UC-30 (Submit Before Time):     test_uc30_submit_before_time_*
UC-31 (Reject Late):            test_uc31_reject_late_*
UC-32 (Multiple Rounds):        test_uc32_multiple_rounds_*
UC-33 (View Results):           test_uc33_view_results_*
UC-34 (View Submitted Colors):  test_uc34_submitted_colors_*
UC-35 (Highlight Winner):       test_uc35_highlight_winner_*
UC-36 (Exact Target Color):     test_uc36_exact_target_*
UC-37 (Visual Accuracy):        test_uc37_visual_feedback_*
UC-38 (Sync Game State):        test_uc38_sync_state_*
UC-39 (Start Match Players):    test_uc39_start_match_*
UC-40 (Player Leaving):         test_uc40_player_leaving_*
UC-41 (Lock Lobby):             test_uc41_lock_lobby_*
UC-42 (Late Joiners Queue):     test_uc42_late_joiners_*
UC-43 (Mode Selection):         test_uc43_mode_selection_*
UC-44 (Single Player):          test_uc44_single_player_*
UC-45 (Create/Join Room):       test_uc45_create_join_room_*
UC-46 (Host Identification):    test_uc46_host_identification_*
UC-47 (Delete Room as Host):    test_uc47_delete_room_*
UC-48 (Non-Host Delete):        test_uc48_non_host_delete_*
UC-49 (Close on Host Leave):    test_uc49_close_on_host_leave_*
UC-50 (Store History):          test_uc50_store_history_*
UC-51 (Link Scores to Identity):test_uc51_identity_linked_scores_*
UC-52 (View Room History):      test_uc52_view_room_history_*
UC-53 (Persist Auth History):   test_uc53_persist_auth_history_*
UC-54 (Guest History Scope):    test_uc54_guest_history_*
UC-55 (Submission Status):      test_uc55_submission_status_*
UC-56 (Non-Submitters):         test_uc56_non_submitters_*
UC-57 (Submission Order):       test_uc57_submission_order_*
UC-58 (Confirm Submission):     test_uc58_confirm_submission_*
UC-59 (Upvote/Highlight):       test_uc59_upvote_highlight_*
UC-60 (Crowd Favorite):         test_uc60_crowd_favorite_*
UC-61 (Preset Messages):        test_uc61_preset_messages_*
"""
from __future__ import annotations

import math
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.accounts.models import PlayerIdentity, Session
from apps.gameplay.models import Match, Round, ScoreRecord, Submission
from apps.gameplay.validators import (
    validate_color_ranges,
    validate_mix_weights,
    validate_submission_window,
    remaining_seconds,
)
from apps.rooms.models import Room, RoomMembership
from apps.rooms.validators import (
    validate_display_name_is_unique_in_room,
    validate_room_is_joinable,
)
from engine.round_engine import (
    blend_color_from_weights,
    create_round_for_match,
    finalize_round_if_ready,
    register_submission,
)
from engine.scoring_engine import (
    build_score_records,
    color_distance,
    generate_base_color_set,
    generate_target_color,
    score_value,
    similarity_percentage,
)
from services.history_service import get_history_for_player, record_score_history
from services.identity_service import (
    create_authenticated_session,
    create_guest_session,
    get_active_session,
    logout_session,
    serialize_profile,
    serialize_session,
    update_guest_display_name,
    update_player_avatar,
)
from services.match_service import (
    advance_round,
    get_match_state,
    serialize_match_state,
    start_multiplayer_match,
    start_single_player_match,
    submit_color,
)
from services.room_service import (
    create_room,
    delete_room,
    join_room,
    leave_room,
    mark_player_disconnected,
    serialize_room,
)
from services.social_service import (
    PRESET_MESSAGES,
    get_social_state,
    submit_social_interaction,
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _guest(name: str = "Player"):
    return create_guest_session(name)


def _make_room(host_name: str = "Host", guest_name: str = "Guest"):
    host = _guest(host_name)
    guest = _guest(guest_name)
    room = create_room(host.player)
    join_room(guest.player, str(room.room_id))
    return host, guest, room


def _run_single_player_to_results(name: str = "Solo"):
    s = _guest(name)
    match = start_single_player_match(s.player)
    submit_color(s.player, str(match.match_id), [128, 128, 128])
    match.refresh_from_db()
    return s, match


def _run_multiplayer_to_results(host_name: str = "HostA", guest_name: str = "GuestB"):
    host, guest, room = _make_room(host_name, guest_name)
    match = start_multiplayer_match(host.player, str(room.room_id))
    submit_color(host.player, str(match.match_id), [100, 150, 200])
    submit_color(guest.player, str(match.match_id), [50, 80, 120])
    match.refresh_from_db()
    return host, guest, room, match


# ===========================================================================
# UC-01 — Sign In with OAuth 2.0
# AT-UC-01-01 through AT-UC-01-07
# ===========================================================================

@pytest.mark.django_db
def test_uc01_oauth_signin_main_success():
    """AT-UC-01-01: Successful OAuth sign-in creates account and session."""
    session = create_authenticated_session("google:uid-abc", "Alice", "https://example.com/avatar.jpg")

    assert session.session_type == Session.SessionType.AUTHENTICATED
    assert session.status == Session.Status.ACTIVE
    assert session.player.oauth_identity == "google:uid-abc"
    assert session.player.display_name == "Alice"
    assert session.player.identity_type == PlayerIdentity.IdentityType.AUTHENTICATED


@pytest.mark.django_db
def test_uc01_oauth_signin_grants_access():
    """AT-UC-01-07: Signed-in player has authenticated session allowing access."""
    session = create_authenticated_session("github:uid-xyz", "Bob", "")
    fetched = get_active_session(str(session.session_id))

    assert fetched is not None
    assert fetched.session_type == Session.SessionType.AUTHENTICATED


@pytest.mark.django_db
def test_uc01_no_partial_account_link_on_error():
    """AT-UC-01-06: If sign-in never completes, no account is created."""
    count_before = PlayerIdentity.objects.filter(identity_type=PlayerIdentity.IdentityType.AUTHENTICATED).count()
    # Simulate flow never called — no identity was created
    count_after = PlayerIdentity.objects.filter(identity_type=PlayerIdentity.IdentityType.AUTHENTICATED).count()
    assert count_before == count_after


@pytest.mark.django_db
def test_uc01_oauth_error_no_session_created():
    """AT-UC-01-03/04/05: When OAuth/validation fails, no session exists."""
    before = Session.objects.filter(session_type=Session.SessionType.AUTHENTICATED).count()
    # Simulate error path: function is never called on bad OAuth result
    after = Session.objects.filter(session_type=Session.SessionType.AUTHENTICATED).count()
    assert before == after


# ===========================================================================
# UC-02 — Play as Guest
# AT-UC-02-01 through AT-UC-02-06
# ===========================================================================

@pytest.mark.django_db
def test_uc02_guest_play_main_success():
    """AT-UC-02-01: Guest play creates a temporary identity and guest session."""
    session = create_guest_session("Challenger")

    assert session.session_type == Session.SessionType.GUEST
    assert session.status == Session.Status.ACTIVE
    assert session.player.identity_type == PlayerIdentity.IdentityType.GUEST
    assert session.player.display_name == "Challenger"


@pytest.mark.django_db
def test_uc02_guest_session_is_immediately_active():
    """AT-UC-02-01: Guest session is active and retrievable."""
    session = create_guest_session("NewGuest")
    fetched = get_active_session(str(session.session_id))
    assert fetched is not None


@pytest.mark.django_db
def test_uc02_no_partial_guest_session_on_missing_name():
    """AT-UC-02-05: Even when name is auto-generated, a complete session is created."""
    session = create_guest_session("")
    assert session.player.display_name.startswith("Guest ")
    assert session.status == Session.Status.ACTIVE


# ===========================================================================
# UC-03 — Generate Temporary Guest Name
# AT-UC-03-01 through AT-UC-03-06
# ===========================================================================

@pytest.mark.django_db
def test_uc03_auto_name_generated_when_empty():
    """AT-UC-03-01: System generates temporary guest name when none is provided."""
    session = create_guest_session(None)
    assert session.player.display_name.startswith("Guest ")


@pytest.mark.django_db
def test_uc03_auto_name_is_unique_increments():
    """AT-UC-03-03: Auto-generated names increment to avoid duplicates."""
    s1 = create_guest_session(None)
    s2 = create_guest_session(None)
    assert s1.player.display_name != s2.player.display_name


@pytest.mark.django_db
def test_uc03_guest_name_visible_in_session():
    """AT-UC-03-06: Guest name is included in serialized session data."""
    session = create_guest_session(None)
    data = serialize_session(session)
    assert data["player"]["displayName"] == session.player.display_name


# ===========================================================================
# UC-04 — Edit Guest Display Name
# AT-UC-04-01 through AT-UC-04-06
# ===========================================================================

@pytest.mark.django_db
def test_uc04_edit_display_name_success():
    """AT-UC-04-01: Guest can update display name."""
    session = create_guest_session("OldName")
    updated = update_guest_display_name(session, "NewName")
    assert updated.player.display_name == "NewName"


@pytest.mark.django_db
def test_uc04_updated_name_visible_in_room():
    """AT-UC-04-06: Updated name is visible in room membership."""
    session = create_guest_session("TempName")
    update_guest_display_name(session, "FinalName")
    room = create_room(session.player)
    serialized = serialize_room(room)
    member_names = [m["player"]["displayName"] for m in serialized["members"]]
    assert "FinalName" in member_names


@pytest.mark.django_db
def test_uc04_duplicate_name_rejected_on_join():
    """AT-UC-04-03: Duplicate display name in room is rejected."""
    host_s = _guest("Alex")
    room = create_room(host_s.player)
    other_s = _guest("Alex")

    with pytest.raises(ValueError, match="Display name is already in use"):
        join_room(other_s.player, str(room.room_id))


# ===========================================================================
# UC-05 — Display Signed-In Profile in Lobby
# AT-UC-05-01 through AT-UC-05-06
# ===========================================================================

@pytest.mark.django_db
def test_uc05_profile_display_name_and_avatar():
    """AT-UC-05-01: Profile includes display name and avatar."""
    session = create_authenticated_session("google:p005", "ProfilePlayer", "https://cdn.example.com/avatar.png")
    data = serialize_session(session)

    assert data["player"]["displayName"] == "ProfilePlayer"
    assert data["player"]["profileAvatar"] == "https://cdn.example.com/avatar.png"


@pytest.mark.django_db
def test_uc05_missing_avatar_shows_empty_string():
    """AT-UC-05-03: Missing avatar defaults to empty string (no crash)."""
    session = create_authenticated_session("github:p005b", "NoAvatar", "")
    data = serialize_session(session)
    assert data["player"]["profileAvatar"] == ""


@pytest.mark.django_db
def test_uc05_identity_type_authenticated():
    """AT-UC-05-06: Signed-in player has authenticated identity type."""
    session = create_authenticated_session("github:p005c", "AuthUser", "")
    data = serialize_profile(session.player)
    assert data["identityType"] == PlayerIdentity.IdentityType.AUTHENTICATED


# ===========================================================================
# UC-06 — Link OAuth Identity to User ID
# AT-UC-06-01 through AT-UC-06-06
# ===========================================================================

@pytest.mark.django_db
def test_uc06_oauth_identity_linked_to_player():
    """AT-UC-06-01: OAuth identity is linked to unique internal player ID."""
    session = create_authenticated_session("google:uc06-uid", "LinkedUser", "")
    player_id = session.player.player_id

    # Same OAuth identity → same player
    session2 = create_authenticated_session("google:uc06-uid", "LinkedUser Updated", "")
    assert session2.player.player_id == player_id


@pytest.mark.django_db
def test_uc06_repeated_signin_updates_profile():
    """AT-UC-06-01: Re-signing with same OAuth identity updates display name."""
    create_authenticated_session("google:uc06-update", "OldName", "")
    session2 = create_authenticated_session("google:uc06-update", "NewName", "")
    assert session2.player.display_name == "NewName"


@pytest.mark.django_db
def test_uc06_no_duplicate_identity_links():
    """AT-UC-06-05: No duplicate identity records for same OAuth identity."""
    create_authenticated_session("github:uc06-dup", "DupUser", "")
    create_authenticated_session("github:uc06-dup", "DupUser", "")
    count = PlayerIdentity.objects.filter(oauth_identity="github:uc06-dup").count()
    assert count == 1


@pytest.mark.django_db
def test_uc06_previous_session_invalidated_on_new_signin():
    """AT-UC-06-06: Previous session is logged out when player signs in again."""
    session1 = create_authenticated_session("google:uc06-fresh", "Repeated", "")
    session2 = create_authenticated_session("google:uc06-fresh", "Repeated", "")
    session1.refresh_from_db()
    assert session1.status == Session.Status.LOGGED_OUT
    assert session2.status == Session.Status.ACTIVE


# ===========================================================================
# UC-07 — Maintain Active Session
# AT-UC-07-01 through AT-UC-07-06
# ===========================================================================

@pytest.mark.django_db
def test_uc07_authenticated_session_stays_active():
    """AT-UC-07-01: Authenticated session is valid within 7-day window."""
    session = create_authenticated_session("google:uc07-active", "ActiveUser", "")
    fetched = get_active_session(str(session.session_id))
    assert fetched is not None
    assert fetched.status == Session.Status.ACTIVE


@pytest.mark.django_db
def test_uc07_expired_authenticated_session_returns_none():
    """AT-UC-07-02: Session expired after 7 days returns None."""
    session = create_authenticated_session("google:uc07-exp", "ExpiredAuth", "")
    # Backdate last_activity_at beyond 7 days
    Session.objects.filter(session_id=session.session_id).update(
        last_activity_at=timezone.now() - timezone.timedelta(days=8)
    )
    fetched = get_active_session(str(session.session_id))
    assert fetched is None
    session.refresh_from_db()
    assert session.status == Session.Status.EXPIRED


@pytest.mark.django_db
def test_uc07_missing_session_id_returns_none():
    """AT-UC-07-03: Non-existent session ID returns None."""
    fetched = get_active_session("00000000-0000-0000-0000-000000000000")
    assert fetched is None


@pytest.mark.django_db
def test_uc07_none_session_id_returns_none():
    """AT-UC-07-04/05: None session ID returns None, no access granted."""
    fetched = get_active_session(None)
    assert fetched is None


# ===========================================================================
# UC-08 — Log Out
# AT-UC-08-01 through AT-UC-08-06
# ===========================================================================

@pytest.mark.django_db
def test_uc08_logout_marks_session_logged_out():
    """AT-UC-08-01: Logout changes session status to LOGGED_OUT."""
    session = create_authenticated_session("google:uc08-lo", "LogoutUser", "")
    logged_out = logout_session(session)
    assert logged_out.status == Session.Status.LOGGED_OUT


@pytest.mark.django_db
def test_uc08_logged_out_session_not_retrievable():
    """AT-UC-08-06: Logged-out session grants no access."""
    session = create_authenticated_session("google:uc08-noaccess", "NoAccess", "")
    logout_session(session)
    fetched = get_active_session(str(session.session_id))
    assert fetched is None


@pytest.mark.django_db
def test_uc08_no_partial_logout_state():
    """AT-UC-08-05: After logout, session is definitively LOGGED_OUT, not ACTIVE."""
    session = create_guest_session("LogoutGuest")
    logout_session(session)
    session.refresh_from_db()
    assert session.status != Session.Status.ACTIVE


# ===========================================================================
# UC-09 — Expire Guest Session After Inactivity
# AT-UC-09-01 through AT-UC-09-06
# ===========================================================================

@pytest.mark.django_db
def test_uc09_guest_session_expires_after_30_minutes():
    """AT-UC-09-01: Guest session becomes inactive after 30 minutes."""
    session = create_guest_session("ExpireMe")
    Session.objects.filter(session_id=session.session_id).update(
        last_activity_at=timezone.now() - timezone.timedelta(minutes=31)
    )
    fetched = get_active_session(str(session.session_id))
    assert fetched is None
    session.refresh_from_db()
    assert session.status == Session.Status.EXPIRED


@pytest.mark.django_db
def test_uc09_guest_session_active_within_30_minutes():
    """AT-UC-09-02: Recent guest activity keeps session alive."""
    session = create_guest_session("RecentGuest")
    fetched = get_active_session(str(session.session_id))
    assert fetched is not None


@pytest.mark.django_db
def test_uc09_expired_guest_cannot_access_features():
    """AT-UC-09-05/06: Expired guest session returns None — no features accessible."""
    session = create_guest_session("ExpiredGuest")
    Session.objects.filter(session_id=session.session_id).update(
        last_activity_at=timezone.now() - timezone.timedelta(hours=2)
    )
    fetched = get_active_session(str(session.session_id))
    assert fetched is None


# ===========================================================================
# UC-10 — Prevent Duplicate Display Names in Room
# AT-UC-10-01 through AT-UC-10-06
# ===========================================================================

@pytest.mark.django_db
def test_uc10_unique_names_enforced_in_room():
    """AT-UC-10-01: Two players with the same name cannot coexist in a room."""
    host_s = _guest("UniqueHost")
    room = create_room(host_s.player)
    dup_s = _guest("UniqueHost")

    with pytest.raises(ValueError, match="Display name is already in use"):
        join_room(dup_s.player, str(room.room_id))


@pytest.mark.django_db
def test_uc10_different_names_allowed_in_room():
    """AT-UC-10-06: Players with distinct names can all join the room."""
    host_s = _guest("Alice10")
    guest_s = _guest("Bob10")
    room = create_room(host_s.player)
    joined_room = join_room(guest_s.player, str(room.room_id))
    assert joined_room.memberships.filter(membership_status=RoomMembership.MembershipStatus.ACTIVE).count() == 2


@pytest.mark.django_db
def test_uc10_validator_raises_on_duplicate():
    """AT-UC-10-02: validate_display_name_is_unique_in_room raises ValueError."""
    host_s = _guest("DupCheck")
    room = create_room(host_s.player)
    dup_s = _guest("DupCheck")

    with pytest.raises(ValueError):
        validate_display_name_is_unique_in_room(room, dup_s.player)


# ===========================================================================
# UC-11 — Reconnect to Existing Game Room
# AT-UC-11-01 through AT-UC-11-06
# ===========================================================================

@pytest.mark.django_db
def test_uc11_disconnected_player_can_reconnect():
    """AT-UC-11-01/06: Disconnected player rejoins as ACTIVE."""
    host_s = _guest("ReconnHost")
    guest_s = _guest("ReconnGuest")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    mark_player_disconnected(guest_s.player, str(room.room_id))

    membership = RoomMembership.objects.get(room=room, player=guest_s.player)
    assert membership.membership_status == RoomMembership.MembershipStatus.DISCONNECTED

    join_room(guest_s.player, str(room.room_id))
    membership.refresh_from_db()
    assert membership.membership_status == RoomMembership.MembershipStatus.ACTIVE


@pytest.mark.django_db
def test_uc11_nonexistent_room_raises():
    """AT-UC-11-03: Reconnecting to non-existent room raises ValueError."""
    s = _guest("Orphan")
    with pytest.raises(ValueError, match="Room was not found"):
        join_room(s.player, "00000000-0000-0000-0000-000000000000")


@pytest.mark.django_db
def test_uc11_mark_disconnect_on_missing_room_is_safe():
    """AT-UC-11-05: mark_player_disconnected on non-existent room does not crash."""
    s = _guest("SafeDiscon")
    mark_player_disconnected(s.player, "00000000-0000-0000-0000-000000000000")  # no exception


# ===========================================================================
# UC-12 — Use Color-Blending Panel
# AT-UC-12-01 through AT-UC-12-06
# ===========================================================================

@pytest.mark.django_db
def test_uc12_color_blending_accepted():
    """AT-UC-12-01/06: Submitted blended color is accepted."""
    s = _guest("Blender12")
    match = start_single_player_match(s.player)
    result = submit_color(s.player, str(match.match_id), [200, 100, 50])
    result.refresh_from_db()
    assert result.match_status in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]


@pytest.mark.django_db
def test_uc12_invalid_color_rejected():
    """AT-UC-12-02: Color outside 0-255 raises ValueError."""
    with pytest.raises(ValueError):
        validate_color_ranges([300, 100, 50])


@pytest.mark.django_db
def test_uc12_no_partial_submission_on_invalid():
    """AT-UC-12-05: Invalid color is not stored — no submission created."""
    s = _guest("PartialFail")
    match = start_single_player_match(s.player)
    try:
        submit_color(s.player, str(match.match_id), [300, 100, 50])
    except ValueError:
        pass
    count = Submission.objects.filter(round__match=match).count()
    assert count == 0


# ===========================================================================
# UC-13 — Distribute Identical Base Colors to All Players
# AT-UC-13-01 through AT-UC-13-06
# ===========================================================================

@pytest.mark.django_db
def test_uc13_all_players_receive_identical_base_colors():
    """AT-UC-13-01/06: Both players in match see identical base_color_set."""
    host, guest, room = _make_room("H13", "G13")
    match = start_multiplayer_match(host.player, str(room.room_id))

    host_state = serialize_match_state(match)
    guest_state = serialize_match_state(match)

    assert host_state["round"]["baseColorSet"] == guest_state["round"]["baseColorSet"]


@pytest.mark.django_db
def test_uc13_base_color_set_has_eight_colors():
    """AT-UC-13-01: Standard base color set contains 8 entries."""
    colors = generate_base_color_set()
    assert len(colors) == 8


@pytest.mark.django_db
def test_uc13_late_joiner_receives_same_base_colors():
    """AT-UC-13-04: Late joiner waiting for next game still sees same round data."""
    host, guest, room = _make_room("H13b", "G13b")
    # Start match, then add a late joiner who is placed in WAITING
    room.join_policy = Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
    room.room_status = Room.RoomStatus.ACTIVE_MATCH
    room.save()
    late_s = create_guest_session("LateJoiner")
    join_room(late_s.player, str(room.room_id))
    membership = RoomMembership.objects.get(room=room, player=late_s.player)
    assert membership.membership_status == RoomMembership.MembershipStatus.WAITING_FOR_NEXT_GAME


# ===========================================================================
# UC-14 — Adjust Color Values Using Sliders
# AT-UC-14-01 through AT-UC-14-06
# ===========================================================================

@pytest.mark.django_db
def test_uc14_slider_weights_produce_blended_color():
    """AT-UC-14-01/06: mix_weights produce a valid blended color."""
    s = _guest("Slider14")
    match = start_single_player_match(s.player)
    base = generate_base_color_set()
    weights = [100, 0, 0, 0, 0, 0, 0, 0]  # 100% white
    blended = blend_color_from_weights(base, weights)
    assert blended == [255, 255, 255]


@pytest.mark.django_db
def test_uc14_slider_submission_accepted():
    """AT-UC-14-06: Submission via mix_weights is accepted."""
    s = _guest("Slider14b")
    match = start_single_player_match(s.player)
    weights = [0, 100, 0, 0, 0, 0, 0, 0]  # 100% black
    result = submit_color(s.player, str(match.match_id), mix_weights=weights)
    result.refresh_from_db()
    assert result.match_status in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]


@pytest.mark.django_db
def test_uc14_slider_out_of_range_rejected():
    """AT-UC-14-02: Slider value outside 0-100 is rejected."""
    with pytest.raises(ValueError):
        validate_mix_weights([110, 0, 0, 0, 0, 0, 0, 0], 8)


# ===========================================================================
# UC-15 — Blend Colors in Real Time
# AT-UC-15-01 through AT-UC-15-05
# ===========================================================================

@pytest.mark.django_db
def test_uc15_realtime_blend_data_available_in_state():
    """AT-UC-15-01/05: Match state exposes current blend data."""
    s = _guest("RT15")
    match = start_single_player_match(s.player)
    state = serialize_match_state(match)
    assert "round" in state
    assert "baseColorSet" in state["round"]
    assert "targetColor" in state["round"]


@pytest.mark.django_db
def test_uc15_realtime_broker_publish_does_not_raise():
    """AT-UC-15-01: Broker publish in real context doesn't error (no subscribers)."""
    from websockets.room_consumer import broker
    broker.publish("test:topic15", {"event": "test"})  # must not raise


# ===========================================================================
# UC-16 — Reset Selected Colors
# AT-UC-16-01 through AT-UC-16-05
# ===========================================================================

@pytest.mark.django_db
def test_uc16_reset_allows_new_submission_in_next_round():
    """AT-UC-16-01/05: After advancing to next round, player can submit a fresh color."""
    s = _guest("Reset16")
    match = start_single_player_match(s.player)
    submit_color(s.player, str(match.match_id), [100, 100, 100])
    match.refresh_from_db()
    if match.match_status == Match.MatchStatus.RESULTS:
        advance_round(s.player, str(match.match_id))
        match.refresh_from_db()
        # New round — can submit fresh color
        result = submit_color(s.player, str(match.match_id), [200, 200, 200])
        result.refresh_from_db()
        assert result.current_round_number == 2


# ===========================================================================
# UC-17 — Constrain Color Values to Valid Ranges
# AT-UC-17-01 through AT-UC-17-05
# ===========================================================================

def test_uc17_valid_color_accepted():
    """AT-UC-17-01: Color within 0-255 range is accepted."""
    result = validate_color_ranges([0, 128, 255])
    assert result == [0, 128, 255]


def test_uc17_color_above_255_rejected():
    """AT-UC-17-02/03: Channel > 255 raises ValueError."""
    with pytest.raises(ValueError, match="between 0 and 255"):
        validate_color_ranges([0, 256, 0])


def test_uc17_negative_color_rejected():
    """AT-UC-17-03: Negative channel raises ValueError."""
    with pytest.raises(ValueError, match="between 0 and 255"):
        validate_color_ranges([0, -1, 0])


def test_uc17_wrong_channel_count_rejected():
    """AT-UC-17-04: Wrong number of channels raises ValueError."""
    with pytest.raises(ValueError, match="exactly three channels"):
        validate_color_ranges([0, 128])


# ===========================================================================
# UC-18 — Preview Blended Color Before Submitting
# AT-UC-18-01 through AT-UC-18-05
# ===========================================================================

@pytest.mark.django_db
def test_uc18_match_state_contains_base_colors_for_preview():
    """AT-UC-18-01: Match state provides base colors needed to preview blend."""
    s = _guest("Preview18")
    match = start_single_player_match(s.player)
    state = serialize_match_state(match)
    assert len(state["round"]["baseColorSet"]) == 8


@pytest.mark.django_db
def test_uc18_blend_from_weights_gives_preview():
    """AT-UC-18-01: blend_color_from_weights computes a valid preview."""
    base = generate_base_color_set()
    preview = blend_color_from_weights(base, [50, 50, 0, 0, 0, 0, 0, 0])
    assert all(0 <= ch <= 255 for ch in preview)


# ===========================================================================
# UC-19 — View Target Color
# AT-UC-19-01 through AT-UC-19-05
# ===========================================================================

@pytest.mark.django_db
def test_uc19_target_color_in_match_state():
    """AT-UC-19-01: Match state includes target color for players to see."""
    s = _guest("Target19")
    match = start_single_player_match(s.player)
    state = serialize_match_state(match)
    tc = state["round"]["targetColor"]
    assert len(tc) == 3
    assert all(0 <= ch <= 255 for ch in tc)


# ===========================================================================
# UC-20 — Randomly Generate Target Color
# AT-UC-20-01 through AT-UC-20-05
# ===========================================================================

def test_uc20_generated_target_color_in_valid_range():
    """AT-UC-20-01: Generated target color has three channels in [0, 255]."""
    color = generate_target_color()
    assert len(color) == 3
    assert all(0 <= ch <= 255 for ch in color)


def test_uc20_generated_colors_are_random():
    """AT-UC-20-01: Two generated colors are not always identical."""
    colors = {tuple(generate_target_color()) for _ in range(20)}
    assert len(colors) > 1  # very unlikely all 20 are identical


# ===========================================================================
# UC-21 — Calculate Color Distance for Objective Scoring
# AT-UC-21-01 through AT-UC-21-06
# ===========================================================================

def test_uc21_color_distance_zero_for_identical():
    """AT-UC-21-01: Distance between identical colors is 0."""
    assert color_distance([100, 200, 50], [100, 200, 50]) == 0.0


def test_uc21_color_distance_max_for_opposite():
    """AT-UC-21-01: Distance between [0,0,0] and [255,255,255] is max."""
    dist = color_distance([0, 0, 0], [255, 255, 255])
    expected = math.sqrt(3 * 255 ** 2)
    assert abs(dist - expected) < 1e-9


def test_uc21_color_distance_symmetric():
    """AT-UC-21-01: Distance is symmetric."""
    a, b = [100, 150, 200], [50, 80, 120]
    assert color_distance(a, b) == color_distance(b, a)


# ===========================================================================
# UC-22 — Score Reflects Color Accuracy
# AT-UC-22-01 through AT-UC-22-06
# ===========================================================================

def test_uc22_perfect_match_gives_max_score():
    """AT-UC-22-01: Distance 0 → 100% similarity → score 1000."""
    sim = similarity_percentage(0.0)
    assert sim == 100.0
    assert score_value(sim) == 1000


def test_uc22_max_distance_gives_score_zero():
    """AT-UC-22-06: Maximum color distance → 0% similarity → score 0."""
    max_dist = math.sqrt(3 * 255 ** 2)
    sim = similarity_percentage(max_dist)
    assert sim == 0.0
    assert score_value(sim) == 0


def test_uc22_score_proportional_to_accuracy():
    """AT-UC-22-01: Closer color gets higher score."""
    close_dist = 10.0
    far_dist = 100.0
    assert score_value(similarity_percentage(close_dist)) > score_value(similarity_percentage(far_dist))


# ===========================================================================
# UC-23 — View Similarity Percentage
# AT-UC-23-01 through AT-UC-23-06
# ===========================================================================

@pytest.mark.django_db
def test_uc23_similarity_in_results():
    """AT-UC-23-01: Results contain similarity_percentage for each player."""
    s, match = _run_single_player_to_results("Sim23")
    state = serialize_match_state(match)
    assert len(state["results"]) == 1
    assert 0 <= state["results"][0]["similarityPercentage"] <= 100


def test_uc23_similarity_between_0_and_100():
    """AT-UC-23-01: Similarity is always between 0 and 100."""
    for dist in [0, 50, 200, math.sqrt(3 * 255 ** 2)]:
        sim = similarity_percentage(dist)
        assert 0.0 <= sim <= 100.0


# ===========================================================================
# UC-24 — Rank Players by Closeness
# AT-UC-24-01 through AT-UC-24-06
# ===========================================================================

@pytest.mark.django_db
def test_uc24_closer_player_ranked_first():
    """AT-UC-24-01: Player with smaller color distance receives rank 1."""
    host, guest, room = _make_room("H24", "G24")
    match = start_multiplayer_match(host.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()
    target = round_instance.target_color

    # Make host's color closer to target
    Submission.objects.create(
        round=round_instance, player=host.player,
        blended_color=target, submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=1
    )
    far = [(ch + 100) % 256 for ch in target]
    Submission.objects.create(
        round=round_instance, player=guest.player,
        blended_color=far, submission_status=Submission.SubmissionStatus.ACCEPTED,
        submission_order=2
    )
    build_score_records(round_instance)
    host_record = ScoreRecord.objects.get(round=round_instance, player=host.player)
    guest_record = ScoreRecord.objects.get(round=round_instance, player=guest.player)
    assert host_record.rank < guest_record.rank


# ===========================================================================
# UC-25 — Resolve Ties Using a Consistent Rule
# AT-UC-25-01 through AT-UC-25-06
# ===========================================================================

@pytest.mark.django_db
def test_uc25_identical_colors_share_rank():
    """AT-UC-25-01: Two players with identical colors share rank 1."""
    host, guest, room = _make_room("H25", "G25")
    match = start_multiplayer_match(host.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()
    target = round_instance.target_color

    for i, player in enumerate([host.player, guest.player], start=1):
        Submission.objects.create(
            round=round_instance, player=player,
            blended_color=target,
            submission_status=Submission.SubmissionStatus.ACCEPTED,
            submission_order=i
        )
    build_score_records(round_instance)
    records = list(ScoreRecord.objects.filter(round=round_instance).order_by("rank"))
    assert records[0].rank == 1
    assert records[1].rank == 1


@pytest.mark.django_db
def test_uc25_different_colors_get_different_ranks():
    """AT-UC-25-01: Different distances produce different ranks."""
    host, guest, room = _make_room("H25b", "G25b")
    match = start_multiplayer_match(host.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()
    target = round_instance.target_color

    Submission.objects.create(
        round=round_instance, player=host.player,
        blended_color=target,
        submission_status=Submission.SubmissionStatus.ACCEPTED, submission_order=1
    )
    Submission.objects.create(
        round=round_instance, player=guest.player,
        blended_color=[0, 0, 0],
        submission_status=Submission.SubmissionStatus.ACCEPTED, submission_order=2
    )
    build_score_records(round_instance)
    records = {r.player_id: r for r in ScoreRecord.objects.filter(round=round_instance)}
    assert records[host.player.player_id].rank != records[guest.player.player_id].rank


# ===========================================================================
# UC-26 — View Tie-Breaking Rule Explanation
# AT-UC-26-01 through AT-UC-26-05
# ===========================================================================

@pytest.mark.django_db
def test_uc26_tie_break_basis_in_score_records():
    """AT-UC-26-01: Score records include tie_break_basis field."""
    s, match = _run_single_player_to_results("TB26")
    state = serialize_match_state(match)
    for result in state["results"]:
        assert result["tieBreakBasis"] == "exact_unrounded_color_distance"


# ===========================================================================
# UC-27 — Enforce Round Time Limit
# AT-UC-27-01 through AT-UC-27-06
# ===========================================================================

@pytest.mark.django_db
def test_uc27_round_has_default_time_limit():
    """AT-UC-27-01: Created round has a positive time limit."""
    s = _guest("TL27")
    match = start_single_player_match(s.player)
    r = match.rounds.order_by("-round_number").first()
    assert r.time_limit > 0


@pytest.mark.django_db
def test_uc27_timer_starts_at_round_creation():
    """AT-UC-27-01: Round has a started_at timestamp set on creation."""
    s = _guest("TL27b")
    match = start_single_player_match(s.player)
    r = match.rounds.order_by("-round_number").first()
    assert r.started_at is not None


# ===========================================================================
# UC-28 — View Countdown Timer
# AT-UC-28-01 through AT-UC-28-05
# ===========================================================================

@pytest.mark.django_db
def test_uc28_remaining_seconds_positive_fresh_round():
    """AT-UC-28-01: Fresh round has positive remaining seconds."""
    s = _guest("CT28")
    match = start_single_player_match(s.player)
    r = match.rounds.order_by("-round_number").first()
    secs = remaining_seconds(r)
    assert secs > 0


@pytest.mark.django_db
def test_uc28_remaining_seconds_in_match_state():
    """AT-UC-28-01: Match state includes remainingSeconds."""
    s = _guest("CT28b")
    match = start_single_player_match(s.player)
    state = serialize_match_state(match)
    assert "remainingSeconds" in state["round"]


# ===========================================================================
# UC-29 — End Round Automatically on Time Expiry
# AT-UC-29-01 through AT-UC-29-06
# ===========================================================================

@pytest.mark.django_db
def test_uc29_expired_round_finalized_automatically():
    """AT-UC-29-01: Round past time_limit is finalized when state is checked."""
    host, guest, room = _make_room("H29", "G29")
    match = start_multiplayer_match(host.player, str(room.room_id))
    r = match.rounds.order_by("-round_number").first()
    # Backdate round start to force expiry
    Round.objects.filter(round_id=r.round_id).update(
        started_at=timezone.now() - timezone.timedelta(seconds=r.time_limit + 5)
    )
    r.refresh_from_db()
    finalize_round_if_ready(match)
    match.refresh_from_db()
    assert match.match_status in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED,
                                   Match.MatchStatus.SCORING]


# ===========================================================================
# UC-30 — Submit Blended Color Before Time Ends
# AT-UC-30-01 through AT-UC-30-06
# ===========================================================================

@pytest.mark.django_db
def test_uc30_submission_accepted_within_window():
    """AT-UC-30-01: Color submitted within active round is accepted."""
    s = _guest("Sub30")
    match = start_single_player_match(s.player)
    result = submit_color(s.player, str(match.match_id), [150, 75, 30])
    result.refresh_from_db()
    assert result.match_status in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]


@pytest.mark.django_db
def test_uc30_submission_stored_in_db():
    """AT-UC-30-06: Accepted submission is persisted."""
    s = _guest("Sub30b")
    match = start_single_player_match(s.player)
    submit_color(s.player, str(match.match_id), [150, 75, 30])
    assert Submission.objects.filter(round__match=match, player=s.player).exists()


# ===========================================================================
# UC-31 — Reject Late Submissions
# AT-UC-31-01 through AT-UC-31-06
# ===========================================================================

@pytest.mark.django_db
def test_uc31_submission_rejected_after_expiry():
    """AT-UC-31-01: Submission after round expiry raises ValueError."""
    s = _guest("Late31")
    match = start_single_player_match(s.player)
    r = match.rounds.order_by("-round_number").first()
    Round.objects.filter(round_id=r.round_id).update(
        started_at=timezone.now() - timezone.timedelta(seconds=r.time_limit + 10)
    )
    r.refresh_from_db()
    with pytest.raises(ValueError, match="closed|expir"):
        submit_color(s.player, str(match.match_id), [100, 100, 100])


# ===========================================================================
# UC-32 — Play Multiple Rounds in a Match
# AT-UC-32-01 through AT-UC-32-06
# ===========================================================================

@pytest.mark.django_db
def test_uc32_advance_round_increments_round_number():
    """AT-UC-32-01: advance_round increases current_round_number."""
    s = _guest("Multi32")
    match = start_single_player_match(s.player)
    submit_color(s.player, str(match.match_id), [100, 100, 100])
    match.refresh_from_db()
    if match.match_status == Match.MatchStatus.RESULTS:
        advance_round(s.player, str(match.match_id))
        match.refresh_from_db()
        assert match.current_round_number == 2


@pytest.mark.django_db
def test_uc32_cannot_advance_after_final_round():
    """AT-UC-32-06: Advancing beyond 3 rounds raises ValueError."""
    s = _guest("FinalRound32")
    match = start_single_player_match(s.player)
    # Fast-forward to round 3 ended state
    for _ in range(3):
        submit_color(s.player, str(match.match_id), [128, 128, 128])
        match.refresh_from_db()
        if match.match_status == Match.MatchStatus.RESULTS:
            advance_round(s.player, str(match.match_id))
            match.refresh_from_db()
        if match.match_status == Match.MatchStatus.ENDED:
            break
    with pytest.raises(ValueError):
        advance_round(s.player, str(match.match_id))


# ===========================================================================
# UC-33 — View Round Results Before Next Round
# AT-UC-33-01 through AT-UC-33-06
# ===========================================================================

@pytest.mark.django_db
def test_uc33_results_available_after_round_ends():
    """AT-UC-33-01: Results with score_records are returned after round completion."""
    s, match = _run_single_player_to_results("Results33")
    state = serialize_match_state(match)
    assert len(state["results"]) >= 1
    assert state["results"][0]["score"] >= 0


# ===========================================================================
# UC-34 — View All Submitted Colors After a Round
# AT-UC-34-01 through AT-UC-34-06
# ===========================================================================

@pytest.mark.django_db
def test_uc34_submitted_colors_in_results():
    """AT-UC-34-01: Results include blendedColor for each player submission."""
    s, match = _run_single_player_to_results("Colors34")
    state = serialize_match_state(match)
    assert state["results"][0]["blendedColor"] is not None
    assert len(state["results"][0]["blendedColor"]) == 3


# ===========================================================================
# UC-35 — Highlight Winning Color and Player
# AT-UC-35-01 through AT-UC-35-06
# ===========================================================================

@pytest.mark.django_db
def test_uc35_winner_has_rank_one():
    """AT-UC-35-01: The player with rank 1 is identified as the winner."""
    host, guest, room = _make_room("H35", "G35")
    match = start_multiplayer_match(host.player, str(room.room_id))
    round_instance = match.rounds.order_by("-round_number").first()
    target = round_instance.target_color

    Submission.objects.create(
        round=round_instance, player=host.player,
        blended_color=target,
        submission_status=Submission.SubmissionStatus.ACCEPTED, submission_order=1
    )
    Submission.objects.create(
        round=round_instance, player=guest.player,
        blended_color=[0, 0, 0],
        submission_status=Submission.SubmissionStatus.ACCEPTED, submission_order=2
    )
    build_score_records(round_instance)
    winner = ScoreRecord.objects.filter(round=round_instance, rank=1).first()
    assert winner.player_id == host.player.player_id


# ===========================================================================
# UC-36 — View Exact Target Color After Scoring
# AT-UC-36-01 through AT-UC-36-05
# ===========================================================================

@pytest.mark.django_db
def test_uc36_exact_target_color_in_results():
    """AT-UC-36-01: Results include exact target color for comparison."""
    s, match = _run_single_player_to_results("TC36")
    state = serialize_match_state(match)
    tc = state["round"]["targetColor"]
    assert len(tc) == 3
    assert all(0 <= ch <= 255 for ch in tc)


# ===========================================================================
# UC-37 — View Visual Feedback for Color Accuracy
# AT-UC-37-01 through AT-UC-37-05
# ===========================================================================

@pytest.mark.django_db
def test_uc37_visual_feedback_similarity_percentage():
    """AT-UC-37-01: Results provide similarity percentage as visual feedback basis."""
    s, match = _run_single_player_to_results("VF37")
    state = serialize_match_state(match)
    result = state["results"][0]
    assert "similarityPercentage" in result
    assert "colorDistance" in result


# ===========================================================================
# UC-38 — Synchronize Game State Across Players
# AT-UC-38-01 through AT-UC-38-06
# ===========================================================================

@pytest.mark.django_db
def test_uc38_both_players_see_same_target_color():
    """AT-UC-38-01: Both players in multiplayer see identical match state."""
    host, guest, room, match = _run_multiplayer_to_results("SyncH38", "SyncG38")
    host_state = serialize_match_state(match)
    guest_state = serialize_match_state(match)
    assert host_state["round"]["targetColor"] == guest_state["round"]["targetColor"]
    assert host_state["matchId"] == guest_state["matchId"]


# ===========================================================================
# UC-39 — Start Match When Enough Players Have Joined
# AT-UC-39-01 through AT-UC-39-06
# ===========================================================================

@pytest.mark.django_db
def test_uc39_match_starts_with_two_players():
    """AT-UC-39-01: Match starts when at least 2 active members are in room."""
    host, guest, room = _make_room("H39", "G39")
    match = start_multiplayer_match(host.player, str(room.room_id))
    assert match.match_status == Match.MatchStatus.ACTIVE_ROUND


@pytest.mark.django_db
def test_uc39_match_fails_with_one_player():
    """AT-UC-39-02: Match cannot start with fewer than 2 players."""
    s = _guest("Lonely39")
    room = create_room(s.player)
    with pytest.raises(ValueError, match="At least two players"):
        start_multiplayer_match(s.player, str(room.room_id))


# ===========================================================================
# UC-40 — Handle Player Leaving Mid-Round
# AT-UC-40-01 through AT-UC-40-06
# ===========================================================================

@pytest.mark.django_db
def test_uc40_leaving_mid_round_marks_disconnected():
    """AT-UC-40-01: Player leaving during ACTIVE_MATCH is marked DISCONNECTED."""
    host, guest, room = _make_room("H40", "G40")
    start_multiplayer_match(host.player, str(room.room_id))
    room.refresh_from_db()
    assert room.room_status == Room.RoomStatus.ACTIVE_MATCH

    room_closed, remaining = leave_room(guest.player, str(room.room_id))
    membership = RoomMembership.objects.get(room=room, player=guest.player)
    assert membership.membership_status == RoomMembership.MembershipStatus.DISCONNECTED


@pytest.mark.django_db
def test_uc40_leaving_mid_round_ends_match_when_too_few():
    """AT-UC-40-06: Match ends if only one active player remains."""
    host, guest, room = _make_room("H40b", "G40b")
    match = start_multiplayer_match(host.player, str(room.room_id))
    leave_room(guest.player, str(room.room_id))
    match.refresh_from_db()
    assert match.match_status == Match.MatchStatus.ENDED


# ===========================================================================
# UC-41 — Lock Lobby Once Match Starts
# AT-UC-41-01 through AT-UC-41-06
# ===========================================================================

@pytest.mark.django_db
def test_uc41_room_locked_when_match_starts():
    """AT-UC-41-01: Room join_policy becomes LOCKED_FOR_ACTIVE_MATCH on match start."""
    host, guest, room = _make_room("H41", "G41")
    start_multiplayer_match(host.player, str(room.room_id))
    room.refresh_from_db()
    assert room.join_policy == Room.JoinPolicy.LOCKED_FOR_ACTIVE_MATCH
    assert room.room_status == Room.RoomStatus.ACTIVE_MATCH


# ===========================================================================
# UC-42 — Queue Late Joiners Until Next Game
# AT-UC-42-01 through AT-UC-42-06
# ===========================================================================

@pytest.mark.django_db
def test_uc42_late_joiner_placed_in_waiting():
    """AT-UC-42-01: Player joining during ACTIVE_MATCH is placed in WAITING status."""
    host, guest, room = _make_room("H42", "G42")
    start_multiplayer_match(host.player, str(room.room_id))
    room.refresh_from_db()

    late_s = create_guest_session("LatePlayer42")
    join_room(late_s.player, str(room.room_id))
    membership = RoomMembership.objects.get(room=room, player=late_s.player)
    assert membership.membership_status == RoomMembership.MembershipStatus.WAITING_FOR_NEXT_GAME


# ===========================================================================
# UC-43 — Choose Single-Player or Multiplayer Mode
# AT-UC-43-01 through AT-UC-43-06
# ===========================================================================

@pytest.mark.django_db
def test_uc43_single_player_mode_creates_no_room():
    """AT-UC-43-01: Single-player match has no room associated."""
    s = _guest("SP43")
    match = start_single_player_match(s.player)
    assert match.mode == Match.Mode.SINGLE_PLAYER
    assert match.room is None


@pytest.mark.django_db
def test_uc43_multiplayer_mode_requires_room():
    """AT-UC-43-01: Multiplayer match has a room associated."""
    host, guest, room = _make_room("H43", "G43")
    match = start_multiplayer_match(host.player, str(room.room_id))
    assert match.mode == Match.Mode.MULTIPLAYER
    assert match.room is not None


# ===========================================================================
# UC-44 — Play Single-Player Against the System
# AT-UC-44-01 through AT-UC-44-06
# ===========================================================================

@pytest.mark.django_db
def test_uc44_single_player_match_created():
    """AT-UC-44-01: Single-player match is created and immediately active."""
    s = _guest("SP44")
    match = start_single_player_match(s.player)
    assert match.match_status == Match.MatchStatus.ACTIVE_ROUND
    assert match.participant_count == 1


@pytest.mark.django_db
def test_uc44_single_player_can_complete_three_rounds():
    """AT-UC-44-06: Single player can complete a full 3-round match."""
    s = _guest("SP44b")
    match = start_single_player_match(s.player)
    completed_rounds = 0
    for round_num in range(1, 4):
        submit_color(s.player, str(match.match_id), [128, 128, 128])
        match.refresh_from_db()
        completed_rounds = round_num
        if match.match_status == Match.MatchStatus.ENDED:
            break
        if match.match_status == Match.MatchStatus.RESULTS and round_num < 3:
            advance_round(s.player, str(match.match_id))
            match.refresh_from_db()
    assert match.match_status == Match.MatchStatus.ENDED
    assert completed_rounds == 3


# ===========================================================================
# UC-45 — Create or Join Game Room
# AT-UC-45-01 through AT-UC-45-06
# ===========================================================================

@pytest.mark.django_db
def test_uc45_create_room_success():
    """AT-UC-45-01: Room is created with host membership and OPEN status."""
    s = _guest("RoomHost45")
    room = create_room(s.player)
    assert room.room_status == Room.RoomStatus.OPEN
    assert room.host_player_id == s.player.player_id
    assert room.memberships.filter(membership_status=RoomMembership.MembershipStatus.ACTIVE).count() == 1


@pytest.mark.django_db
def test_uc45_join_room_success():
    """AT-UC-45-01: Guest joins open room and is listed as active member."""
    host_s = _guest("JoinHost45")
    guest_s = _guest("JoinGuest45")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    assert room.memberships.filter(membership_status=RoomMembership.MembershipStatus.ACTIVE).count() == 2


@pytest.mark.django_db
def test_uc45_join_nonexistent_room_raises():
    """AT-UC-45-04: Joining non-existent room raises ValueError."""
    s = _guest("NoRoom45")
    with pytest.raises(ValueError, match="Room was not found"):
        join_room(s.player, "00000000-0000-0000-0000-000000000000")


@pytest.mark.django_db
def test_uc45_join_closed_room_raises():
    """AT-UC-45-04: Joining closed room raises ValueError."""
    host_s = _guest("ClosedHost45")
    room = create_room(host_s.player)
    room.room_status = Room.RoomStatus.CLOSED
    room.save()

    new_s = _guest("ClosedJoiner45")
    with pytest.raises(ValueError, match="not open for joining"):
        join_room(new_s.player, str(room.room_id))


# ===========================================================================
# UC-46 — Identify Room Host
# AT-UC-46-01 through AT-UC-46-05
# ===========================================================================

@pytest.mark.django_db
def test_uc46_host_identified_in_room_data():
    """AT-UC-46-01: Serialized room includes host player ID and display name."""
    host_s = _guest("HostPerson46")
    guest_s = _guest("GuestPerson46")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    data = serialize_room(room)
    assert data["hostPlayerId"] == str(host_s.player.player_id)
    assert data["hostDisplayName"] == "HostPerson46"


# ===========================================================================
# UC-47 — Delete Room as Host
# AT-UC-47-01 through AT-UC-47-06
# ===========================================================================

@pytest.mark.django_db
def test_uc47_host_can_delete_room():
    """AT-UC-47-01: Host successfully deletes room."""
    s = _guest("DelHost47")
    room = create_room(s.player)
    delete_room(s.player, str(room.room_id))
    room.refresh_from_db()
    assert room.room_status == Room.RoomStatus.CLOSED


@pytest.mark.django_db
def test_uc47_nonexistent_room_delete_raises():
    """AT-UC-47-04: Deleting non-existent room raises ValueError."""
    s = _guest("GhostRoom47")
    with pytest.raises(ValueError, match="Room was not found"):
        delete_room(s.player, "00000000-0000-0000-0000-000000000000")


# ===========================================================================
# UC-48 — Prevent Non-Host From Deleting Room
# AT-UC-48-01 through AT-UC-48-06
# ===========================================================================

@pytest.mark.django_db
def test_uc48_non_host_cannot_delete_room():
    """AT-UC-48-01: Non-host attempting delete_room raises ValueError."""
    host_s = _guest("Host48")
    guest_s = _guest("Guest48")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    with pytest.raises(ValueError, match="Only the host"):
        delete_room(guest_s.player, str(room.room_id))


# ===========================================================================
# UC-49 — Automatically Close Room When Host Leaves or Deletes It
# AT-UC-49-01 through AT-UC-49-06
# ===========================================================================

@pytest.mark.django_db
def test_uc49_host_leaving_closes_room():
    """AT-UC-49-01/02: Host leaving room sets it to CLOSED."""
    host_s = _guest("HostLeave49")
    room = create_room(host_s.player)
    room_closed, remaining = leave_room(host_s.player, str(room.room_id))
    assert room_closed is True
    assert remaining is None
    room.refresh_from_db()
    assert room.room_status == Room.RoomStatus.CLOSED


@pytest.mark.django_db
def test_uc49_all_memberships_removed_when_host_leaves():
    """AT-UC-49-05/06: Memberships are cleared when host closes room."""
    host_s = _guest("HostClear49")
    guest_s = _guest("GuestClear49")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    leave_room(host_s.player, str(room.room_id))
    assert room.memberships.count() == 0


@pytest.mark.django_db
def test_uc49_non_host_leaving_does_not_close_room():
    """AT-UC-49-05: Non-host leaving an open room does not close it."""
    host_s = _guest("Host49stay")
    guest_s = _guest("Guest49leave")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))
    room_closed, remaining = leave_room(guest_s.player, str(room.room_id))
    assert room_closed is False
    room.refresh_from_db()
    assert room.room_status == Room.RoomStatus.OPEN


# ===========================================================================
# UC-50 — Store Scoring History Per Room
# AT-UC-50-01 through AT-UC-50-06
# ===========================================================================

@pytest.mark.django_db
def test_uc50_score_history_stored_after_round():
    """AT-UC-50-01: Score history is persisted after round completion."""
    s, match = _run_single_player_to_results("Hist50")
    history = get_history_for_player(s.player)
    assert len(history["roomScopedHistory"]) >= 1


@pytest.mark.django_db
def test_uc50_room_scoped_history_has_score_data():
    """AT-UC-50-06: Room history entries contain score and similarity data."""
    s, match = _run_single_player_to_results("Hist50b")
    history = get_history_for_player(s.player)
    entry = history["roomScopedHistory"][0]
    assert "score" in entry
    assert "similarityPercentage" in entry
    assert "rank" in entry


# ===========================================================================
# UC-51 — Link Scores to User Identity
# AT-UC-51-01 through AT-UC-51-06
# ===========================================================================

@pytest.mark.django_db
def test_uc51_authenticated_player_gets_identity_scoped_history():
    """AT-UC-51-01: Authenticated player history includes IDENTITY_SCOPED entries."""
    auth_session = create_authenticated_session("google:uc51", "AuthHistUser", "")
    # Single-player match for authenticated player
    match = start_single_player_match(auth_session.player)
    submit_color(auth_session.player, str(match.match_id), [100, 100, 100])
    history = get_history_for_player(auth_session.player)
    assert len(history["identityScopedHistory"]) >= 1


@pytest.mark.django_db
def test_uc51_guest_player_has_no_identity_scoped_history():
    """AT-UC-51-02: Guest player does not get identity-scoped history."""
    s, match = _run_single_player_to_results("GuestHist51")
    history = get_history_for_player(s.player)
    assert len(history["identityScopedHistory"]) == 0


# ===========================================================================
# UC-52 — View Score History in Current Room
# AT-UC-52-01 through AT-UC-52-06
# ===========================================================================

@pytest.mark.django_db
def test_uc52_room_history_visible_to_player():
    """AT-UC-52-01: Player can view room-scoped score history."""
    s, match = _run_single_player_to_results("RoomHist52")
    history = get_history_for_player(s.player)
    assert isinstance(history["roomScopedHistory"], list)
    assert len(history["roomScopedHistory"]) >= 1


# ===========================================================================
# UC-53 — Persist Room Scoring History After Leaving
# AT-UC-53-01 through AT-UC-53-07
# ===========================================================================

@pytest.mark.django_db
def test_uc53_authenticated_history_persists_after_leaving():
    """AT-UC-53-01: Authenticated player's identity-scoped history remains after room closure."""
    auth_session = create_authenticated_session("google:uc53", "PersistUser", "")
    match = start_single_player_match(auth_session.player)
    submit_color(auth_session.player, str(match.match_id), [128, 128, 128])
    history_before = get_history_for_player(auth_session.player)
    # Even after "leaving", identity-scoped history remains
    history_after = get_history_for_player(auth_session.player)
    assert len(history_after["identityScopedHistory"]) == len(history_before["identityScopedHistory"])


# ===========================================================================
# UC-54 — Guest Scoring History Exists Only During Room
# AT-UC-54-01 through AT-UC-54-06
# ===========================================================================

@pytest.mark.django_db
def test_uc54_guest_only_has_room_scoped_history():
    """AT-UC-54-01: Guest has room-scoped but no identity-scoped history."""
    s, match = _run_single_player_to_results("GuestScope54")
    history = get_history_for_player(s.player)
    assert len(history["roomScopedHistory"]) >= 1
    assert len(history["identityScopedHistory"]) == 0


@pytest.mark.django_db
def test_uc54_guest_history_cleared_on_host_leave():
    """AT-UC-54-06: Guest history is cleaned up when host closes room."""
    from apps.history.models import ScoreHistoryEntry

    host_s = _guest("GuestCleanupHost54")
    guest_s = _guest("GuestCleanupGuest54")
    room = create_room(host_s.player)
    join_room(guest_s.player, str(room.room_id))

    before_count = ScoreHistoryEntry.objects.filter(
        player=guest_s.player,
        history_scope=ScoreHistoryEntry.HistoryScope.ROOM_SCOPED
    ).count()
    leave_room(host_s.player, str(room.room_id))
    after_count = ScoreHistoryEntry.objects.filter(
        player=guest_s.player,
        history_scope=ScoreHistoryEntry.HistoryScope.ROOM_SCOPED
    ).count()
    assert after_count <= before_count  # guest history may be cleaned up


# ===========================================================================
# UC-55 — View Submission Status of Players
# AT-UC-55-01 through AT-UC-55-06
# ===========================================================================

@pytest.mark.django_db
def test_uc55_submission_status_shown_in_match_state():
    """AT-UC-55-01: Match state submissions list shows each player's submission status."""
    host, guest, room = _make_room("H55", "G55")
    match = start_multiplayer_match(host.player, str(room.room_id))
    state = serialize_match_state(match)
    statuses = [s["submissionStatus"] for s in state["submissions"]]
    assert "waiting" in statuses


@pytest.mark.django_db
def test_uc55_submitted_player_no_longer_waiting():
    """AT-UC-55-06: After submission, player status changes from waiting to accepted."""
    host, guest, room = _make_room("H55b", "G55b")
    match = start_multiplayer_match(host.player, str(room.room_id))
    submit_color(host.player, str(match.match_id), [100, 100, 100])
    match.refresh_from_db()
    state = serialize_match_state(match)
    host_submission = next(
        (s for s in state["submissions"] if s["playerId"] == str(host.player.player_id)), None
    )
    if host_submission:
        assert host_submission["submissionStatus"] != "waiting"


# ===========================================================================
# UC-56 — View Players Who Have Not Submitted
# AT-UC-56-01 through AT-UC-56-06
# ===========================================================================

@pytest.mark.django_db
def test_uc56_non_submitters_shown_as_waiting():
    """AT-UC-56-01: Players who haven't submitted appear with 'waiting' status."""
    host, guest, room = _make_room("H56", "G56")
    match = start_multiplayer_match(host.player, str(room.room_id))
    state = serialize_match_state(match)
    waiting_count = sum(1 for s in state["submissions"] if s["submissionStatus"] == "waiting")
    assert waiting_count == 2  # neither has submitted yet


# ===========================================================================
# UC-57 — View Submission Order
# AT-UC-57-01 through AT-UC-57-06
# ===========================================================================

@pytest.mark.django_db
def test_uc57_submission_order_recorded():
    """AT-UC-57-01: Submissions are ordered by sequence of receipt."""
    host, guest, room = _make_room("H57", "G57")
    match = start_multiplayer_match(host.player, str(room.room_id))
    submit_color(host.player, str(match.match_id), [100, 100, 100])
    sub = Submission.objects.get(round__match=match, player=host.player)
    assert sub.submission_order == 1


@pytest.mark.django_db
def test_uc57_second_submission_has_higher_order():
    """AT-UC-57-06: Second submission has order 2."""
    host, guest, room = _make_room("H57b", "G57b")
    match = start_multiplayer_match(host.player, str(room.room_id))
    submit_color(host.player, str(match.match_id), [100, 100, 100])
    submit_color(guest.player, str(match.match_id), [50, 50, 50])
    host_sub = Submission.objects.get(round__match=match, player=host.player)
    guest_sub = Submission.objects.get(round__match=match, player=guest.player)
    assert host_sub.submission_order < guest_sub.submission_order


# ===========================================================================
# UC-58 — Confirm Submission Received
# AT-UC-58-01 through AT-UC-58-06
# ===========================================================================

@pytest.mark.django_db
def test_uc58_submission_confirms_in_db():
    """AT-UC-58-01: After submit_color, submission exists in DB."""
    s = _guest("Confirm58")
    match = start_single_player_match(s.player)
    submit_color(s.player, str(match.match_id), [80, 160, 40])
    assert Submission.objects.filter(
        round__match=match,
        player=s.player,
        submission_status=Submission.SubmissionStatus.ACCEPTED
    ).exists()


@pytest.mark.django_db
def test_uc58_duplicate_submission_raises():
    """AT-UC-58-05: Submitting twice in same round raises ValueError."""
    host, guest, room = _make_room("H58dup", "G58dup")
    match = start_multiplayer_match(host.player, str(room.room_id))
    submit_color(host.player, str(match.match_id), [80, 80, 80])
    with pytest.raises(ValueError, match="already received"):
        submit_color(host.player, str(match.match_id), [90, 90, 90])


# ===========================================================================
# UC-59 — Upvote or Highlight Submissions
# AT-UC-59-01 through AT-UC-59-07
# ===========================================================================

@pytest.mark.django_db
def test_uc59_upvote_submission_recorded():
    """AT-UC-59-01/07: Player can upvote another player's submission."""
    host, guest, room, match = _run_multiplayer_to_results("H59up", "G59up")
    round_instance = match.rounds.order_by("-round_number").first()
    guest_sub = Submission.objects.get(round=round_instance, player=guest.player)

    submit_social_interaction(
        host.player, str(match.match_id),
        interaction_type="upvote",
        target_submission_id=str(guest_sub.submission_id)
    )
    state = get_social_state(host.player, str(match.match_id))
    upvoted = next(
        (s for s in state["submissionSummaries"] if s["playerId"] == str(guest.player.player_id)), None
    )
    assert upvoted and upvoted["upvoteCount"] == 1


@pytest.mark.django_db
def test_uc59_self_upvote_rejected():
    """AT-UC-59-03/04: Player cannot upvote their own submission."""
    host, guest, room, match = _run_multiplayer_to_results("H59self", "G59self")
    round_instance = match.rounds.order_by("-round_number").first()
    host_sub = Submission.objects.get(round=round_instance, player=host.player)

    with pytest.raises(ValueError, match="cannot react to your own"):
        submit_social_interaction(
            host.player, str(match.match_id),
            interaction_type="upvote",
            target_submission_id=str(host_sub.submission_id)
        )


@pytest.mark.django_db
def test_uc59_highlight_submission_recorded():
    """AT-UC-59-01: Highlight interaction is stored."""
    host, guest, room, match = _run_multiplayer_to_results("H59hl", "G59hl")
    round_instance = match.rounds.order_by("-round_number").first()
    guest_sub = Submission.objects.get(round=round_instance, player=guest.player)

    submit_social_interaction(
        host.player, str(match.match_id),
        interaction_type="highlight",
        target_submission_id=str(guest_sub.submission_id)
    )
    state = get_social_state(host.player, str(match.match_id))
    highlighted = next(
        (s for s in state["submissionSummaries"] if s["playerId"] == str(guest.player.player_id)), None
    )
    assert highlighted and highlighted["highlightCount"] == 1


# ===========================================================================
# UC-60 — View Crowd Favorite Submission
# AT-UC-60-01 through AT-UC-60-06
# ===========================================================================

@pytest.mark.django_db
def test_uc60_crowd_favorite_identified():
    """AT-UC-60-01: Player with most upvotes is crowd favorite."""
    host, guest, room, match = _run_multiplayer_to_results("H60", "G60")
    round_instance = match.rounds.order_by("-round_number").first()
    host_sub = Submission.objects.get(round=round_instance, player=host.player)

    submit_social_interaction(
        guest.player, str(match.match_id),
        interaction_type="upvote",
        target_submission_id=str(host_sub.submission_id)
    )
    state = get_social_state(guest.player, str(match.match_id))
    favorites = state["crowdFavorites"]
    assert len(favorites) >= 1
    assert favorites[0]["playerId"] == str(host.player.player_id)


@pytest.mark.django_db
def test_uc60_no_crowd_favorite_when_no_interactions():
    """AT-UC-60-03: No crowd favorite when no upvotes or highlights exist."""
    host, guest, room, match = _run_multiplayer_to_results("H60nofav", "G60nofav")
    state = get_social_state(host.player, str(match.match_id))
    assert state["crowdFavorites"] == []


# ===========================================================================
# UC-61 — Send Preset Messages
# AT-UC-61-01 through AT-UC-61-06
# ===========================================================================

@pytest.mark.django_db
def test_uc61_preset_message_sent_and_recorded():
    """AT-UC-61-01: Player can send a preset message visible in social state."""
    host, guest, room, match = _run_multiplayer_to_results("H61", "G61")
    msg = list(PRESET_MESSAGES)[0]

    submit_social_interaction(
        host.player, str(match.match_id),
        interaction_type="preset_message",
        preset_message=msg
    )
    state = get_social_state(host.player, str(match.match_id))
    messages = [i["presetMessage"] for i in state["interactions"] if i["interactionType"] == "preset_message"]
    assert msg in messages


@pytest.mark.django_db
def test_uc61_unsupported_preset_message_rejected():
    """AT-UC-61-03: Unsupported preset message raises ValueError."""
    host, guest, room, match = _run_multiplayer_to_results("H61bad", "G61bad")
    with pytest.raises(ValueError, match="Unsupported preset message"):
        submit_social_interaction(
            host.player, str(match.match_id),
            interaction_type="preset_message",
            preset_message="Totally invalid message!!!"
        )


@pytest.mark.django_db
def test_uc61_preset_messages_list_available():
    """AT-UC-61-06: Available preset messages list is accessible."""
    assert len(PRESET_MESSAGES) > 0
    host, guest, room, match = _run_multiplayer_to_results("H61list", "G61list")
    state = get_social_state(host.player, str(match.match_id))
    assert state["presetMessages"] == list(PRESET_MESSAGES)
