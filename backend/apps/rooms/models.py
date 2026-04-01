import uuid

from django.db import models


class Room(models.Model):
    class RoomStatus(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

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
