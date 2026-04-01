import uuid

from django.db import models


class PlayerIdentity(models.Model):
    class IdentityType(models.TextChoices):
        AUTHENTICATED = "authenticated", "Authenticated"
        GUEST = "guest", "Guest"

    player_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identity_type = models.CharField(max_length=32, choices=IdentityType.choices)
    display_name = models.CharField(max_length=64)
    profile_avatar = models.URLField(blank=True)
    oauth_identity = models.CharField(max_length=255, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Session(models.Model):
    class SessionType(models.TextChoices):
        AUTHENTICATED = "authenticated", "Authenticated"
        GUEST = "guest", "Guest"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        LOGGED_OUT = "logged_out", "Logged out"

    session_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    player = models.ForeignKey(
        PlayerIdentity,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    session_type = models.CharField(max_length=32, choices=SessionType.choices)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.ACTIVE)
    last_activity_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
