from __future__ import annotations

from datetime import timedelta
from typing import Sequence

from django.utils import timezone

from apps.gameplay.models import Round


TIE_BREAK_BASIS = "exact_unrounded_color_distance"


def validate_color_ranges(color: Sequence[int]) -> list[int]:
    if len(color) != 3:
        raise ValueError("Color must contain exactly three channels.")

    normalized = [int(channel) for channel in color]
    for channel in normalized:
        if channel < 0 or channel > 255:
            raise ValueError("Color channels must be between 0 and 255.")

    return normalized


def validate_mix_weights(weights: Sequence[int], expected_count: int) -> list[int]:
    if len(weights) != expected_count:
        raise ValueError("Mix weights must match the available source colors.")

    normalized = [int(weight) for weight in weights]
    for weight in normalized:
        if weight < 0 or weight > 100:
            raise ValueError("Mix weights must be between 0 and 100.")

    if sum(normalized) <= 0:
        raise ValueError("At least one source color must be used in the blend.")

    return normalized


def validate_tie_break_basis(tie_break_basis: str) -> None:
    if tie_break_basis != TIE_BREAK_BASIS:
        raise ValueError("Unsupported tie-break basis.")


def validate_submission_window(round_instance: Round) -> None:
    if round_instance.round_status != Round.RoundStatus.ACTIVE_BLENDING:
        raise ValueError("Submission window is closed.")

    expiry = round_instance.started_at + timedelta(seconds=round_instance.time_limit)
    if timezone.now() > expiry:
        raise ValueError("Submission arrived after timer expiry.")


def remaining_seconds(round_instance: Round) -> int:
    expiry = round_instance.started_at + timedelta(seconds=round_instance.time_limit)
    return max(0, int((expiry - timezone.now()).total_seconds()))
