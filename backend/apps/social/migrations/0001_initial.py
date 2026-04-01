import django.db.models.deletion
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("accounts", "0001_initial"),
        ("gameplay", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SocialInteraction",
            fields=[
                (
                    "social_interaction_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "interaction_type",
                    models.CharField(
                        choices=[
                            ("upvote", "Upvote"),
                            ("highlight", "Highlight"),
                            ("preset_message", "Preset message"),
                        ],
                        max_length=32,
                    ),
                ),
                ("preset_message", models.CharField(blank=True, max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="social_interactions",
                        to="accounts.playeridentity",
                    ),
                ),
                (
                    "round",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="social_interactions",
                        to="gameplay.round",
                    ),
                ),
                (
                    "target_submission",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="social_interactions",
                        to="gameplay.submission",
                    ),
                ),
            ],
        ),
    ]
