from unittest.mock import patch

import pytest

from apps.gameplay.models import Match, Round, ScoreRecord
from services.identity_service import create_guest_session
from services.match_service import (
    _match_players,
    _record_history_for_match,
    _serialize_score_record,
    get_match_state,
    serialize_match_state,
    start_multiplayer_match,
    start_single_player_match,
    submit_color,
)
from services.room_service import create_room, join_room


def _create_multiplayer_room():
    host = create_guest_session("Host").player
    guest = create_guest_session("Guest").player
    room = create_room(host)
    join_room(guest, str(room.room_id))
    return host, guest, room


@pytest.mark.django_db
def test_match_players_returns_empty_for_single_player_without_submission() -> None:
    player = create_guest_session("Solo").player
    match = start_single_player_match(player)

    assert _match_players(match) == []


@pytest.mark.django_db
@patch("engine.scoring_engine.random.randint", side_effect=[80, 90, 100])
def test_match_players_returns_submission_player_for_single_player(_mock_randint) -> None:
    player = create_guest_session("Solo").player
    match = start_single_player_match(player)

    submit_color(player, str(match.match_id), [80, 90, 100])

    players = _match_players(match)

    assert [resolved.player_id for resolved in players] == [player.player_id]


@pytest.mark.django_db
def test_match_players_returns_active_multiplayer_members() -> None:
    host, guest, room = _create_multiplayer_room()
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=2,
    )

    players = _match_players(match)

    assert {player.player_id for player in players} == {host.player_id, guest.player_id}


@pytest.mark.django_db
def test_serialize_score_record_uses_none_when_submission_is_missing() -> None:
    player = create_guest_session("Solo").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.RESULTS,
        current_round_number=1,
        participant_count=1,
    )
    round_instance = Round.objects.create(
        match=match,
        round_number=1,
        target_color=[10, 20, 30],
        base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        time_limit=60,
        round_status=Round.RoundStatus.RESULTS,
    )
    score_record = ScoreRecord.objects.create(
        round=round_instance,
        player=player,
        color_distance=1.5,
        score=998,
        similarity_percentage=99.8,
        rank=1,
        tie_break_basis="exact_unrounded_color_distance",
    )

    serialized = _serialize_score_record(score_record)

    assert serialized["blendedColor"] is None
    assert serialized["displayName"] == "Solo"


@pytest.mark.django_db
def test_serialize_match_state_raises_when_round_is_missing() -> None:
    player = create_guest_session("Solo").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )

    with pytest.raises(ValueError, match="Match does not have a round."):
        serialize_match_state(match)


@pytest.mark.django_db
@patch("services.match_service.record_score_history")
def test_record_history_for_match_skips_non_result_status(mock_record_score_history) -> None:
    player = create_guest_session("Solo").player
    match = start_single_player_match(player)

    _record_history_for_match(match)

    mock_record_score_history.assert_not_called()


@pytest.mark.django_db
@patch("services.match_service.record_score_history")
def test_record_history_for_match_skips_result_without_round(mock_record_score_history) -> None:
    Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.RESULTS,
        current_round_number=1,
        participant_count=1,
    )
    match = Match.objects.get()

    _record_history_for_match(match)

    mock_record_score_history.assert_not_called()


@pytest.mark.django_db
@patch("services.match_service.record_score_history")
def test_record_history_for_match_records_each_score_record(mock_record_score_history) -> None:
    player = create_guest_session("Solo").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.RESULTS,
        current_round_number=1,
        participant_count=1,
    )
    round_instance = Round.objects.create(
        match=match,
        round_number=1,
        target_color=[10, 20, 30],
        base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        time_limit=60,
        round_status=Round.RoundStatus.RESULTS,
    )
    score_record = ScoreRecord.objects.create(
        round=round_instance,
        player=player,
        color_distance=0,
        score=1000,
        similarity_percentage=100,
        rank=1,
        tie_break_basis="exact_unrounded_color_distance",
    )

    _record_history_for_match(match)

    mock_record_score_history.assert_called_once_with(score_record)


@pytest.mark.django_db
def test_start_multiplayer_match_rejects_non_member() -> None:
    host = create_guest_session("Host").player
    outsider = create_guest_session("Outsider").player
    room = create_room(host)

    with pytest.raises(ValueError, match="Player is not an active member of this room."):
        start_multiplayer_match(outsider, str(room.room_id))


@pytest.mark.django_db
def test_start_multiplayer_match_rejects_room_with_fewer_than_two_active_members() -> None:
    host = create_guest_session("Host").player
    room = create_room(host)

    with pytest.raises(
        ValueError,
        match="At least two players are required to start multiplayer gameplay.",
    ):
        start_multiplayer_match(host, str(room.room_id))


@pytest.mark.django_db
def test_start_multiplayer_match_rejects_existing_active_match() -> None:
    host, _guest, room = _create_multiplayer_room()
    Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=2,
    )

    with pytest.raises(ValueError, match="A gameplay session is already active for this room."):
        start_multiplayer_match(host, str(room.room_id))


@pytest.mark.django_db
@patch("services.match_service.create_round_for_match")
def test_start_multiplayer_match_creates_match_for_active_members(mock_create_round_for_match) -> None:
    host, _guest, room = _create_multiplayer_room()

    match = start_multiplayer_match(host, str(room.room_id))

    assert match.mode == Match.Mode.MULTIPLAYER
    assert match.room_id == room.room_id
    assert match.participant_count == 2
    mock_create_round_for_match.assert_called_once_with(match)


@pytest.mark.django_db
def test_submit_color_raises_when_match_is_missing() -> None:
    player = create_guest_session("Solo").player

    with pytest.raises(ValueError, match="Match was not found."):
        submit_color(player, "00000000-0000-0000-0000-000000000001", [10, 20, 30])


@pytest.mark.django_db
def test_submit_color_raises_when_match_is_not_accepting_submissions() -> None:
    player = create_guest_session("Solo").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.SCORING,
        current_round_number=1,
        participant_count=1,
    )

    with pytest.raises(ValueError, match="Match is not accepting submissions."):
        submit_color(player, str(match.match_id), [10, 20, 30])


@pytest.mark.django_db
def test_submit_color_rejects_multiplayer_player_outside_room() -> None:
    host, guest, room = _create_multiplayer_room()
    outsider = create_guest_session("Outsider").player
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=2,
    )
    Round.objects.create(
        match=match,
        round_number=1,
        target_color=[10, 20, 30],
        base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        time_limit=60,
        round_status=Round.RoundStatus.ACTIVE_BLENDING,
    )

    with pytest.raises(ValueError, match="Player is not active in the room for this match."):
        submit_color(outsider, str(match.match_id), [10, 20, 30])


@pytest.mark.django_db
@patch("services.match_service.publish_result_publication")
@patch("services.match_service.publish_scoring_update")
@patch("services.match_service.publish_submission_receipt")
@patch("services.match_service._record_history_for_match")
@patch("services.match_service.finalize_round_if_ready")
@patch("services.match_service.register_submission")
def test_submit_color_allows_active_multiplayer_member(
    mock_register_submission,
    mock_finalize_round_if_ready,
    mock_record_history_for_match,
    mock_publish_submission_receipt,
    mock_publish_scoring_update,
    mock_publish_result_publication,
) -> None:
    host, guest, room = _create_multiplayer_room()
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=2,
    )
    round_instance = Round.objects.create(
        match=match,
        round_number=1,
        target_color=[10, 20, 30],
        base_color_set=[[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        time_limit=60,
        round_status=Round.RoundStatus.ACTIVE_BLENDING,
    )

    submit_color(guest, str(match.match_id), blended_color=[10, 20, 30])

    mock_register_submission.assert_called_once_with(round_instance, guest, blended_color=[10, 20, 30], mix_weights=None)
    mock_finalize_round_if_ready.assert_called_once_with(match)
    mock_record_history_for_match.assert_called_once_with(match)
    mock_publish_submission_receipt.assert_called_once_with(match)
    mock_publish_scoring_update.assert_not_called()
    mock_publish_result_publication.assert_not_called()


@pytest.mark.django_db
def test_submit_color_raises_when_round_is_missing() -> None:
    player = create_guest_session("Solo").player
    match = Match.objects.create(
        mode=Match.Mode.SINGLE_PLAYER,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=1,
    )

    with pytest.raises(ValueError, match="Match round was not found."):
        submit_color(player, str(match.match_id), [10, 20, 30])


@pytest.mark.django_db
@patch("services.match_service.publish_submission_rejection")
@patch("services.match_service.register_submission", side_effect=ValueError("Submission window is closed."))
def test_submit_color_publishes_rejection_on_registration_error(
    _mock_register_submission,
    mock_publish_submission_rejection,
) -> None:
    player = create_guest_session("Solo").player
    match = start_single_player_match(player)

    with pytest.raises(ValueError, match="Submission window is closed."):
        submit_color(player, str(match.match_id), [10, 20, 30])

    mock_publish_submission_rejection.assert_called_once_with(
        str(match.match_id),
        player,
        "Submission window is closed.",
    )


@pytest.mark.django_db
@patch("services.match_service.publish_result_publication")
@patch("services.match_service.publish_scoring_update")
@patch("services.match_service.publish_submission_receipt")
@patch("services.match_service._record_history_for_match")
@patch("services.match_service.finalize_round_if_ready")
@patch("services.match_service.register_submission")
def test_submit_color_only_publishes_receipt_while_match_stays_active(
    mock_register_submission,
    mock_finalize_round_if_ready,
    mock_record_history_for_match,
    mock_publish_submission_receipt,
    mock_publish_scoring_update,
    mock_publish_result_publication,
) -> None:
    player = create_guest_session("Solo").player
    match = start_single_player_match(player)

    submit_color(player, str(match.match_id), [10, 20, 30])

    mock_register_submission.assert_called_once()
    mock_finalize_round_if_ready.assert_called_once_with(match)
    mock_record_history_for_match.assert_called_once_with(match)
    mock_publish_submission_receipt.assert_called_once_with(match)
    mock_publish_scoring_update.assert_not_called()
    mock_publish_result_publication.assert_not_called()


@pytest.mark.django_db
@patch("services.match_service.publish_result_publication")
@patch("services.match_service.publish_scoring_update")
@patch("services.match_service.publish_submission_receipt")
@patch("services.match_service._record_history_for_match")
@patch("services.match_service.register_submission")
def test_submit_color_publishes_scoring_and_results_for_completed_match(
    mock_register_submission,
    mock_record_history_for_match,
    mock_publish_submission_receipt,
    mock_publish_scoring_update,
    mock_publish_result_publication,
) -> None:
    player = create_guest_session("Solo").player
    match = start_single_player_match(player)

    def finalize_to_results(resolved_match):
        resolved_match.match_status = Match.MatchStatus.RESULTS
        resolved_match.save(update_fields=["match_status"])

    with patch("services.match_service.finalize_round_if_ready", side_effect=finalize_to_results):
        submit_color(player, str(match.match_id), [10, 20, 30])

    mock_register_submission.assert_called_once()
    mock_record_history_for_match.assert_called_once_with(match)
    mock_publish_submission_receipt.assert_called_once_with(match)
    mock_publish_scoring_update.assert_called_once_with(match)
    mock_publish_result_publication.assert_called_once_with(match)


@pytest.mark.django_db
def test_get_match_state_raises_when_match_is_missing() -> None:
    player = create_guest_session("Solo").player

    with pytest.raises(ValueError, match="Match was not found."):
        get_match_state(player, "00000000-0000-0000-0000-000000000001")


@pytest.mark.django_db
def test_get_match_state_rejects_multiplayer_player_outside_room() -> None:
    host, guest, room = _create_multiplayer_room()
    outsider = create_guest_session("Outsider").player
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=2,
    )

    with pytest.raises(ValueError, match="Player is not active in the room for this match."):
        get_match_state(outsider, str(match.match_id))


@pytest.mark.django_db
@patch("services.match_service._record_history_for_match")
@patch("services.match_service.finalize_round_if_ready")
def test_get_match_state_finalizes_and_records_for_authorized_player(
    mock_finalize_round_if_ready,
    mock_record_history_for_match,
) -> None:
    host, guest, room = _create_multiplayer_room()
    match = Match.objects.create(
        mode=Match.Mode.MULTIPLAYER,
        room=room,
        match_status=Match.MatchStatus.ACTIVE_ROUND,
        current_round_number=1,
        participant_count=2,
    )

    resolved = get_match_state(guest, str(match.match_id))

    assert resolved.match_id == match.match_id
    mock_finalize_round_if_ready.assert_called_once_with(match)
    mock_record_history_for_match.assert_called_once_with(match)
