import uuid

from django.db import models


class Room(models.Model):
    class RoomStatus(models.TextChoices):
        OPEN = "open", "Open"
        ACTIVE_MATCH = "active_match", "Active match"
        CLOSED = "closed", "Closed"

    class JoinPolicy(models.TextChoices):
        OPEN = "open", "Open"
        LOCKED_FOR_ACTIVE_MATCH = "locked_for_active_match", "Locked for active match"

    class WaitingPolicy(models.TextChoices):
        LATE_JOIN_WAITING_ALLOWED = "late_join_waiting_allowed", "Late join waiting allowed"

    room_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    host_player = models.ForeignKey(
        "accounts.PlayerIdentity",
        on_delete=models.CASCADE,
        related_name="hosted_rooms",
    )
    room_status = models.CharField(
        max_length=32,
        choices=RoomStatus.choices,
        default=RoomStatus.OPEN,
    )
    join_policy = models.CharField(
        max_length=32,
        choices=JoinPolicy.choices,
        default=JoinPolicy.OPEN,
    )
    waiting_policy = models.CharField(
        max_length=64,
        choices=WaitingPolicy.choices,
        default=WaitingPolicy.LATE_JOIN_WAITING_ALLOWED,
    )
    created_at = models.DateTimeField(auto_now_add=True)


class RoomMembership(models.Model):
    class MembershipStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        DISCONNECTED = "disconnected", "Disconnected"
        WAITING_FOR_NEXT_GAME = "waiting_for_next_game", "Waiting for next game"

    room_membership_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="memberships")
    player = models.ForeignKey(
        "accounts.PlayerIdentity",
        on_delete=models.CASCADE,
        related_name="room_memberships",
    )
    membership_status = models.CharField(
        max_length=32,
        choices=MembershipStatus.choices,
        default=MembershipStatus.ACTIVE,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["room", "player"],
                name="unique_room_membership_per_player",
            )
        ]
