import pytest
from django.test import Client


@pytest.mark.django_db
def test_guest_entry_current_session_profile_and_logout_flow() -> None:
    client = Client()

    guest_response = client.post(
        "/sessions/guest/",
        data='{"displayName":"Guest Player"}',
        content_type="application/json",
    )
    assert guest_response.status_code == 201
    assert guest_response.json()["session"]["player"]["displayName"] == "Guest Player"

    current_response = client.get("/sessions/current/")
    assert current_response.status_code == 200
    assert current_response.json()["session"]["sessionType"] == "guest"

    update_response = client.patch(
        "/sessions/current/update/",
        data='{"displayName":"Renamed Guest"}',
        content_type="application/json",
    )
    assert update_response.status_code == 200
    assert update_response.json()["session"]["player"]["displayName"] == "Renamed Guest"

    profile_response = client.get("/profile/")
    assert profile_response.status_code == 200
    assert profile_response.json()["profile"]["displayName"] == "Renamed Guest"

    logout_response = client.post("/sessions/logout/")
    assert logout_response.status_code == 200
    assert logout_response.json() == {"loggedOut": True}

    assert client.get("/sessions/current/").status_code == 401


@pytest.mark.django_db
def test_room_create_join_and_leave_flow() -> None:
    host_client = Client()
    guest_client = Client()

    host_client.post(
        "/sessions/guest/",
        data='{"displayName":"Host Player"}',
        content_type="application/json",
    )
    create_response = host_client.post("/rooms/create/", content_type="application/json")
    assert create_response.status_code == 201
    room_id = create_response.json()["room"]["roomId"]
    assert create_response.json()["room"]["hostDisplayName"] == "Host Player"
    assert len(create_response.json()["room"]["members"]) == 1

    guest_client.post(
        "/sessions/guest/",
        data='{"displayName":"Guest Player"}',
        content_type="application/json",
    )
    join_response = guest_client.post(
        "/rooms/join/",
        data=f'{{"roomId":"{room_id}"}}',
        content_type="application/json",
    )
    assert join_response.status_code == 200
    assert len(join_response.json()["room"]["members"]) == 2

    leave_response = guest_client.post(
        "/rooms/leave/",
        data=f'{{"roomId":"{room_id}"}}',
        content_type="application/json",
    )
    assert leave_response.status_code == 200
    assert leave_response.json()["roomClosed"] is False
    assert len(leave_response.json()["room"]["members"]) == 1

    host_leave_response = host_client.post(
        "/rooms/leave/",
        data=f'{{"roomId":"{room_id}"}}',
        content_type="application/json",
    )
    assert host_leave_response.status_code == 200
    assert host_leave_response.json()["roomClosed"] is True
    assert host_leave_response.json()["room"] is None


@pytest.mark.django_db
def test_gameplay_start_submit_and_state_flow() -> None:
    client = Client()

    guest_response = client.post(
        "/sessions/guest/",
        data='{"displayName":"Gameplay Player"}',
        content_type="application/json",
    )
    assert guest_response.status_code == 201

    start_response = client.post(
        "/gameplay/start/",
        data='{"mode":"single_player"}',
        content_type="application/json",
    )
    assert start_response.status_code == 201
    match_id = start_response.json()["gameplay"]["matchId"]

    submit_response = client.post(
        "/gameplay/submit/",
        data=f'{{"matchId":"{match_id}","blendedColor":[10,20,30]}}',
        content_type="application/json",
    )
    assert submit_response.status_code == 200

    state_response = client.get(f"/gameplay/state/?matchId={match_id}")
    assert state_response.status_code == 200
    assert state_response.json()["gameplay"]["matchId"] == match_id


@pytest.mark.django_db
def test_history_retrieval_returns_room_and_identity_scopes() -> None:
    client = Client()

    client.post(
        "/sessions/guest/",
        data='{"displayName":"History Player"}',
        content_type="application/json",
    )
    start_response = client.post(
        "/gameplay/start/",
        data='{"mode":"single_player"}',
        content_type="application/json",
    )
    match_id = start_response.json()["gameplay"]["matchId"]
    client.post(
        "/gameplay/submit/",
        data=f'{{"matchId":"{match_id}","blendedColor":[10,20,30]}}',
        content_type="application/json",
    )

    history_response = client.get("/history/")
    assert history_response.status_code == 200
    assert len(history_response.json()["history"]["roomScopedHistory"]) == 1
    assert history_response.json()["history"]["identityScopedHistory"] == []


@pytest.mark.django_db
def test_social_submission_and_retrieval_flow() -> None:
    # Two-player multiplayer so Player B can upvote Player A's submission.
    host_client = Client()
    guest_client = Client()

    host_client.post(
        "/sessions/guest/",
        data='{"displayName":"Social Host"}',
        content_type="application/json",
    )
    guest_client.post(
        "/sessions/guest/",
        data='{"displayName":"Social Guest"}',
        content_type="application/json",
    )

    # Host creates room, guest joins
    room_response = host_client.post("/rooms/create/", content_type="application/json")
    assert room_response.status_code == 201
    room_id = room_response.json()["room"]["roomId"]

    join_response = guest_client.post(
        "/rooms/join/",
        data=f'{{"roomId":"{room_id}"}}',
        content_type="application/json",
    )
    assert join_response.status_code == 200

    # Host starts match
    start_response = host_client.post(
        "/gameplay/start/",
        data=f'{{"mode":"multiplayer","roomId":"{room_id}"}}',
        content_type="application/json",
    )
    assert start_response.status_code == 201
    match_id = start_response.json()["gameplay"]["matchId"]

    # Both players submit
    host_client.post(
        "/gameplay/submit/",
        data=f'{{"matchId":"{match_id}","blendedColor":[10,20,30]}}',
        content_type="application/json",
    )
    guest_client.post(
        "/gameplay/submit/",
        data=f'{{"matchId":"{match_id}","blendedColor":[50,60,70]}}',
        content_type="application/json",
    )

    # Guest fetches social state to find Host's submission ID
    state_response = guest_client.get(f"/social/state/?matchId={match_id}")
    assert state_response.status_code == 200
    summaries = state_response.json()["social"]["submissionSummaries"]
    # Find Host's submission (not Guest's own)
    host_submission_id = next(
        s["submissionId"] for s in summaries if s["displayName"] == "Social Host"
    )

    # Guest upvotes Host's submission
    social_submit_response = guest_client.post(
        "/social/submit/",
        data=(
            f'{{"matchId":"{match_id}","interactionType":"upvote",'
            f'"targetSubmissionId":"{host_submission_id}"}}'
        ),
        content_type="application/json",
    )
    assert social_submit_response.status_code == 201
    crowd_favorites = social_submit_response.json()["social"]["crowdFavorites"]
    assert len(crowd_favorites) >= 1
    assert crowd_favorites[0]["submissionId"] == host_submission_id

    # Guest sends a preset message
    preset_submit_response = guest_client.post(
        "/social/submit/",
        data=f'{{"matchId":"{match_id}","interactionType":"preset_message","presetMessage":"Nice blend!"}}',
        content_type="application/json",
    )
    assert preset_submit_response.status_code == 201

    social_state_response = guest_client.get(f"/social/state/?matchId={match_id}")
    assert social_state_response.status_code == 200
    social_payload = social_state_response.json()["social"]
    host_summary = next(s for s in social_payload["submissionSummaries"] if s["displayName"] == "Social Host")
    assert host_summary["upvoteCount"] == 1
    assert social_payload["interactions"][-1]["presetMessage"] == "Nice blend!"
    assert social_payload["presetMessages"] == ["Nice blend!", "Great match!", "So close!"]


@pytest.mark.django_db
def test_oauth_endpoints_validate_provider_and_state() -> None:
    client = Client()

    start_response = client.get("/auth/oauth/start/")
    assert start_response.status_code == 400
    assert start_response.json()["error"] == "Unsupported OAuth provider."

    complete_response = client.get("/auth/oauth/complete/?provider=google")
    assert complete_response.status_code == 400
    assert complete_response.json()["error"] == "OAuth provider could not be verified."
