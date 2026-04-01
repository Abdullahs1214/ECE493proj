import django.db.models.deletion
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("gameplay", "0001_initial"),
        ("rooms", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ScoreHistoryEntry",
            fields=[
                (
                    "score_history_entry_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "history_scope",
                    models.CharField(
                        choices=[
                            ("room_scoped", "Room scoped"),
                            ("identity_scoped", "Identity scoped"),
                        ],
                        max_length=32,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="score_history_entries",
                        to="accounts.playeridentity",
                    ),
                ),
                (
                    "room",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="score_history_entries",
                        to="rooms.room",
                    ),
                ),
                (
                    "round",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="score_history_entries",
                        to="gameplay.round",
                    ),
                ),
                (
                    "score_record",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="history_entries",
                        to="gameplay.scorerecord",
                    ),
                ),
            ],
        ),
    ]
