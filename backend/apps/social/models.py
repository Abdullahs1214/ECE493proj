import uuid

from django.db import models


class SocialInteraction(models.Model):
    class InteractionType(models.TextChoices):
        UPVOTE = "upvote", "Upvote"
        HIGHLIGHT = "highlight", "Highlight"
        PRESET_MESSAGE = "preset_message", "Preset message"

    social_interaction_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    round = models.ForeignKey(
        "gameplay.Round",
        on_delete=models.CASCADE,
        related_name="social_interactions",
    )
    player = models.ForeignKey(
        "accounts.PlayerIdentity",
        on_delete=models.CASCADE,
        related_name="social_interactions",
    )
    interaction_type = models.CharField(max_length=32, choices=InteractionType.choices)
    target_submission = models.ForeignKey(
        "gameplay.Submission",
        on_delete=models.CASCADE,
        related_name="social_interactions",
        null=True,
        blank=True,
    )
    preset_message = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
