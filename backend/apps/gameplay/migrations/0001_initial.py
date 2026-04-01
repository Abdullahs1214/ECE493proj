import django.db.models.deletion
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("rooms", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Match",
            fields=[
                (
                    "match_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "mode",
                    models.CharField(
                        choices=[
                            ("single_player", "Single player"),
                            ("multiplayer", "Multiplayer"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "match_status",
                    models.CharField(
                        choices=[
                            ("waiting_for_players", "Waiting for players"),
                            ("active_round", "Active round"),
                            ("scoring", "Scoring"),
                            ("results", "Results"),
                            ("ended", "Ended"),
                        ],
                        default="waiting_for_players",
                        max_length=32,
                    ),
                ),
                ("current_round_number", models.PositiveIntegerField(default=1)),
                ("participant_count", models.PositiveIntegerField(default=1)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                (
                    "room",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="matches",
                        to="rooms.room",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Round",
            fields=[
                (
                    "round_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("round_number", models.PositiveIntegerField()),
                ("target_color", models.JSONField()),
                ("base_color_set", models.JSONField()),
                ("time_limit", models.PositiveIntegerField(default=60)),
                (
                    "round_status",
                    models.CharField(
                        choices=[
                            ("active_blending", "Active blending"),
                            ("submission_closed", "Submission closed"),
                            ("scoring", "Scoring"),
                            ("results", "Results"),
                        ],
                        default="active_blending",
                        max_length=32,
                    ),
                ),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                (
                    "match",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rounds",
                        to="gameplay.match",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Submission",
            fields=[
                (
                    "submission_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("blended_color", models.JSONField()),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                (
                    "submission_status",
                    models.CharField(
                        choices=[("accepted", "Accepted"), ("rejected_late", "Rejected late")],
                        max_length=32,
                    ),
                ),
                ("submission_order", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="submissions",
                        to="accounts.playeridentity",
                    ),
                ),
                (
                    "round",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="submissions",
                        to="gameplay.round",
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(
                        fields=("round", "player"),
                        name="unique_submission_per_round_player",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="ScoreRecord",
            fields=[
                (
                    "score_record_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("color_distance", models.FloatField()),
                ("score", models.IntegerField()),
                ("similarity_percentage", models.FloatField()),
                ("rank", models.PositiveIntegerField()),
                ("tie_break_basis", models.CharField(default="exact_unrounded_color_distance", max_length=64)),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="score_records",
                        to="accounts.playeridentity",
                    ),
                ),
                (
                    "round",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="score_records",
                        to="gameplay.round",
                    ),
                ),
            ],
        ),
    ]
