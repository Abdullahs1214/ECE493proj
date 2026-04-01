from __future__ import annotations

from collections import Counter
from typing import Any

from apps.accounts.models import PlayerIdentity
from apps.gameplay.models import Match, Round, Submission
from apps.rooms.models import RoomMembership
from apps.social.models import SocialInteraction


PRESET_MESSAGES = (
    "Nice blend!",
    "Great match!",
    "So close!",
)


def _get_match_and_round(match_id: str) -> tuple[Match, Round]:
    match = Match.objects.select_related("room").filter(match_id=match_id).first()
    if match is None:
        raise ValueError("Match was not found.")

    round_instance = match.rounds.order_by("-round_number").first()
    if round_instance is None:
        raise ValueError("Round was not found.")

    if match.match_status not in [Match.MatchStatus.RESULTS, Match.MatchStatus.ENDED]:
        raise ValueError("Social interactions are only available during results.")

    return match, round_instance


def _validate_player_access(player: PlayerIdentity, match: Match, round_instance: Round) -> None:
    if match.mode == Match.Mode.MULTIPLAYER:
        membership = RoomMembership.objects.filter(
            room=match.room,
            player=player,
            membership_status=RoomMembership.MembershipStatus.ACTIVE,
        ).exists()
        if not membership:
            raise ValueError("Player is not active in the room for this match.")
        return

    participated = Submission.objects.filter(round=round_instance, player=player).exists()
    if not participated:
        raise ValueError("Player is not a participant in this match.")


def _serialize_interaction(interaction: SocialInteraction) -> dict[str, Any]:
    return {
        "socialInteractionId": str(interaction.social_interaction_id),
        "interactionType": interaction.interaction_type,
        "playerId": str(interaction.player.player_id),
        "displayName": interaction.player.display_name,
        "targetSubmissionId": (
            str(interaction.target_submission_id) if interaction.target_submission_id else None
        ),
        "targetDisplayName": (
            interaction.target_submission.player.display_name
            if interaction.target_submission_id and interaction.target_submission is not None
            else None
        ),
        "presetMessage": interaction.preset_message,
    }


def _build_submission_summaries(
    round_instance: Round,
    interactions: list[SocialInteraction],
    viewer: PlayerIdentity,
) -> list[dict[str, Any]]:
    upvote_counter = Counter(
        interaction.target_submission_id
        for interaction in interactions
        if interaction.interaction_type == SocialInteraction.InteractionType.UPVOTE
        and interaction.target_submission_id is not None
    )
    highlight_counter = Counter(
        interaction.target_submission_id
        for interaction in interactions
        if interaction.interaction_type == SocialInteraction.InteractionType.HIGHLIGHT
        and interaction.target_submission_id is not None
    )
    viewer_upvotes = {
        interaction.target_submission_id
        for interaction in interactions
        if interaction.interaction_type == SocialInteraction.InteractionType.UPVOTE
        and interaction.player_id == viewer.player_id
        and interaction.target_submission_id is not None
    }
    viewer_highlights = {
        interaction.target_submission_id
        for interaction in interactions
        if interaction.interaction_type == SocialInteraction.InteractionType.HIGHLIGHT
        and interaction.player_id == viewer.player_id
        and interaction.target_submission_id is not None
    }

    submissions = list(
        round_instance.submissions.select_related("player").order_by(
            "submission_order",
            "submitted_at",
        )
    )
    return [
        {
            "submissionId": str(submission.submission_id),
            "playerId": str(submission.player.player_id),
            "displayName": submission.player.display_name,
            "upvoteCount": upvote_counter.get(submission.submission_id, 0),
            "highlightCount": highlight_counter.get(submission.submission_id, 0),
            "hasUpvoted": submission.submission_id in viewer_upvotes,
            "hasHighlighted": submission.submission_id in viewer_highlights,
        }
        for submission in submissions
    ]


def _build_crowd_favorite(submission_summaries: list[dict[str, Any]]) -> dict[str, Any] | None:
    ranked = sorted(
        submission_summaries,
        key=lambda summary: (
            -(summary["upvoteCount"] + summary["highlightCount"]),
            -summary["upvoteCount"],
            -summary["highlightCount"],
            summary["displayName"],
        ),
    )
    if not ranked:
        return None

    favorite = ranked[0]
    reaction_count = favorite["upvoteCount"] + favorite["highlightCount"]
    if reaction_count == 0:
        return None

    return {
        "submissionId": favorite["submissionId"],
        "playerId": favorite["playerId"],
        "displayName": favorite["displayName"],
        "reactionCount": reaction_count,
        "upvoteCount": favorite["upvoteCount"],
        "highlightCount": favorite["highlightCount"],
    }


def submit_social_interaction(
    player: PlayerIdentity,
    match_id: str,
    interaction_type: str,
    target_submission_id: str | None = None,
    preset_message: str | None = None,
) -> None:
    match, round_instance = _get_match_and_round(match_id)
    _validate_player_access(player, match, round_instance)

    submission = None
    if interaction_type in {
        SocialInteraction.InteractionType.UPVOTE,
        SocialInteraction.InteractionType.HIGHLIGHT,
    }:
        if not target_submission_id:
            raise ValueError("targetSubmissionId is required for submission reactions.")
        submission = Submission.objects.filter(
            submission_id=target_submission_id,
            round=round_instance,
        ).first()
        if submission is None:
            raise ValueError("Target submission was not found.")
    elif interaction_type == SocialInteraction.InteractionType.PRESET_MESSAGE:
        if not preset_message or preset_message not in PRESET_MESSAGES:
            raise ValueError("Unsupported preset message.")
    else:
        raise ValueError("Unsupported interaction type.")

    if interaction_type == SocialInteraction.InteractionType.PRESET_MESSAGE:
        SocialInteraction.objects.create(
            round=round_instance,
            player=player,
            interaction_type=interaction_type,
            preset_message=preset_message,
        )
        return

    SocialInteraction.objects.get_or_create(
        round=round_instance,
        player=player,
        interaction_type=interaction_type,
        target_submission=submission,
        defaults={"preset_message": ""},
    )


def get_social_state(player: PlayerIdentity, match_id: str) -> dict[str, Any]:
    match, round_instance = _get_match_and_round(match_id)
    _validate_player_access(player, match, round_instance)

    interactions = list(
        round_instance.social_interactions.select_related("player", "target_submission__player").order_by(
            "created_at",
            "social_interaction_id",
        )
    )
    submission_summaries = _build_submission_summaries(round_instance, interactions, player)

    return {
        "presetMessages": list(PRESET_MESSAGES),
        "interactions": [_serialize_interaction(interaction) for interaction in interactions],
        "submissionSummaries": submission_summaries,
        "crowdFavorite": _build_crowd_favorite(submission_summaries),
    }
