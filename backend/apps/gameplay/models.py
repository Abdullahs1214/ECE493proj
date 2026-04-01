import uuid

from django.db import models


class Match(models.Model):
    class Mode(models.TextChoices):
        SINGLE_PLAYER = "single_player", "Single player"
        MULTIPLAYER = "multiplayer", "Multiplayer"

    class MatchStatus(models.TextChoices):
        WAITING_FOR_PLAYERS = "waiting_for_players", "Waiting for players"
        ACTIVE_ROUND = "active_round", "Active round"
        SCORING = "scoring", "Scoring"
        RESULTS = "results", "Results"
        ENDED = "ended", "Ended"

    match_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mode = models.CharField(max_length=32, choices=Mode.choices)
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="matches",
        null=True,
        blank=True,
    )
    match_status = models.CharField(
        max_length=32,
        choices=MatchStatus.choices,
        default=MatchStatus.WAITING_FOR_PLAYERS,
    )
    current_round_number = models.PositiveIntegerField(default=1)
    participant_count = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)


class Round(models.Model):
    class RoundStatus(models.TextChoices):
        ACTIVE_BLENDING = "active_blending", "Active blending"
        SUBMISSION_CLOSED = "submission_closed", "Submission closed"
        SCORING = "scoring", "Scoring"
        RESULTS = "results", "Results"

    round_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="rounds")
    round_number = models.PositiveIntegerField()
    target_color = models.JSONField()
    base_color_set = models.JSONField()
    time_limit = models.PositiveIntegerField(default=60)
    round_status = models.CharField(
        max_length=32,
        choices=RoundStatus.choices,
        default=RoundStatus.ACTIVE_BLENDING,
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)


class Submission(models.Model):
    class SubmissionStatus(models.TextChoices):
        ACCEPTED = "accepted", "Accepted"
        REJECTED_LATE = "rejected_late", "Rejected late"

    submission_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name="submissions")
    player = models.ForeignKey(
        "accounts.PlayerIdentity",
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    blended_color = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    submission_status = models.CharField(max_length=32, choices=SubmissionStatus.choices)
    submission_order = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["round", "player"],
                name="unique_submission_per_round_player",
            )
        ]


class ScoreRecord(models.Model):
    score_record_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name="score_records")
    player = models.ForeignKey(
        "accounts.PlayerIdentity",
        on_delete=models.CASCADE,
        related_name="score_records",
    )
    color_distance = models.FloatField()
    score = models.IntegerField()
    similarity_percentage = models.FloatField()
    rank = models.PositiveIntegerField()
    tie_break_basis = models.CharField(
        max_length=64,
        default="exact_unrounded_color_distance",
    )
