from __future__ import annotations

import math
import random

from apps.gameplay.models import Round, ScoreRecord, Submission
from apps.gameplay.validators import TIE_BREAK_BASIS, validate_tie_break_basis


def generate_target_color() -> list[int]:
    return [random.randint(0, 255) for _ in range(3)]


def generate_base_color_set() -> list[list[int]]:
    return [
        [255, 255, 255],  # White
        [0, 0, 0],        # Black
        [255, 0, 0],      # Red
        [0, 255, 0],      # Green
        [0, 0, 255],      # Blue
        [0, 255, 255],    # Cyan
        [255, 0, 255],    # Magenta
        [255, 255, 0],    # Yellow
    ]


def color_distance(target_color: list[int], blended_color: list[int]) -> float:
    return math.sqrt(
        sum((target_channel - blended_channel) ** 2 for target_channel, blended_channel in zip(target_color, blended_color))
    )


def similarity_percentage(distance: float) -> float:
    max_distance = math.sqrt(3 * (255**2))
    return max(0.0, round((1 - (distance / max_distance)) * 100, 2))


def score_value(similarity: float) -> int:
    return int(round(similarity * 10))


def build_score_records(round_instance: Round) -> None:
    validate_tie_break_basis(TIE_BREAK_BASIS)
    submissions = list(
        round_instance.submissions.select_related("player").filter(
            submission_status=Submission.SubmissionStatus.ACCEPTED
        )
    )
    ranked = sorted(
        submissions,
        key=lambda submission: color_distance(round_instance.target_color, submission.blended_color),
    )

    round_instance.score_records.all().delete()
    for index, submission in enumerate(ranked, start=1):
        distance = color_distance(round_instance.target_color, submission.blended_color)
        similarity = similarity_percentage(distance)
        ScoreRecord.objects.create(
            round=round_instance,
            player=submission.player,
            color_distance=distance,
            score=score_value(similarity),
            similarity_percentage=similarity,
            rank=index,
            tie_break_basis=TIE_BREAK_BASIS,
        )
