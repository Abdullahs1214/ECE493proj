import uuid

from django.db import models


class ScoreHistoryEntry(models.Model):
    class HistoryScope(models.TextChoices):
        ROOM_SCOPED = "room_scoped", "Room scoped"
        IDENTITY_SCOPED = "identity_scoped", "Identity scoped"

    score_history_entry_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="score_history_entries",
        null=True,
        blank=True,
    )
    player = models.ForeignKey(
        "accounts.PlayerIdentity",
        on_delete=models.CASCADE,
        related_name="score_history_entries",
    )
    round = models.ForeignKey(
        "gameplay.Round",
        on_delete=models.CASCADE,
        related_name="score_history_entries",
    )
    score_record = models.ForeignKey(
        "gameplay.ScoreRecord",
        on_delete=models.CASCADE,
        related_name="history_entries",
    )
    history_scope = models.CharField(max_length=32, choices=HistoryScope.choices)
    created_at = models.DateTimeField(auto_now_add=True)
