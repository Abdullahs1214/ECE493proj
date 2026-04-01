from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PlayerIdentity",
            fields=[
                (
                    "player_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "identity_type",
                    models.CharField(
                        choices=[("authenticated", "Authenticated"), ("guest", "Guest")],
                        max_length=32,
                    ),
                ),
                ("display_name", models.CharField(max_length=64)),
                ("profile_avatar", models.URLField(blank=True)),
                (
                    "oauth_identity",
                    models.CharField(blank=True, max_length=255, null=True, unique=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Session",
            fields=[
                (
                    "session_id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "session_type",
                    models.CharField(
                        choices=[("authenticated", "Authenticated"), ("guest", "Guest")],
                        max_length=32,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("active", "Active"),
                            ("expired", "Expired"),
                            ("logged_out", "Logged out"),
                        ],
                        default="active",
                        max_length=32,
                    ),
                ),
                ("last_activity_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sessions",
                        to="accounts.playeridentity",
                    ),
                ),
            ],
        ),
    ]
