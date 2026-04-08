import { useEffect, useState } from "react";

import BlendControls from "../components/BlendControls";
import { useGameplayState } from "../hooks/useGameplayState";
import type { GameMode } from "../types/game";
import ResultsContainer from "./ResultsContainer";

interface BlendGameContainerProps {
  mode: GameMode;
  roomId?: string;
  initialMatchId?: string;
  currentPlayerId: string;
  onBackToMenu?: () => void;
}

export default function BlendGameContainer({
  mode,
  roomId,
  initialMatchId,
  currentPlayerId,
  onBackToMenu,
}: BlendGameContainerProps) {
  const { gameplay, errorMessage, isLoading, submitColor } = useGameplayState({
    mode,
    roomId,
    initialMatchId,
  });

  const [blendedColor, setBlendedColor] = useState<number[]>([128, 128, 128]);
  const [hasLocallySubmitted, setHasLocallySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setHasLocallySubmitted(false);
    setIsSubmitting(false);
  }, [gameplay?.matchId, gameplay?.round.roundId]);

  if (isLoading) {
    return <section className="status-card">Loading gameplay...</section>;
  }

  if (errorMessage || !gameplay) {
    return <section className="status-card">{errorMessage ?? "Gameplay unavailable."}</section>;
  }

  if (gameplay.matchStatus === "results" || gameplay.matchStatus === "ended") {
    return (
      <ResultsContainer
        matchId={gameplay.matchId}
        round={gameplay.round}
        results={gameplay.results}
        mode={mode}
        onBackToMenu={onBackToMenu}
      />
    );
  }

  const hasBackendSubmission = gameplay.submissions.some(
    (s) => s.playerId === currentPlayerId && s.submissionStatus !== "waiting",
  );

  const hasSubmitted = hasLocallySubmitted || hasBackendSubmission;

  async function handleSubmit() {
    if (hasSubmitted || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitColor(blendedColor);
      setHasLocallySubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="status-card">
        <p className="eyebrow">Round</p>
        <h2>{hasSubmitted ? "Waiting for other players" : "Blend Your Color"}</h2>
        <p>Time remaining: {gameplay.round.remainingSeconds}s</p>
        <p>Target color</p>

        <div
          className="color-preview"
          style={{
            backgroundColor: `rgb(${gameplay.round.targetColor[0]}, ${gameplay.round.targetColor[1]}, ${gameplay.round.targetColor[2]})`,
          }}
        />

        {hasSubmitted ? (
          <p>✅ Your submission has been received.</p>
        ) : (
          <p>Adjust the sliders to match the target color as closely as possible.</p>
        )}

        <div style={{ marginTop: "12px" }}>
          {gameplay.submissions.map((s) => (
            <p key={s.playerId}>
              {s.displayName} — {s.submissionStatus !== "waiting" ? "Submitted" : "Waiting"}
            </p>
          ))}
        </div>

        {onBackToMenu ? (
          <div className="actions">
            <button type="button" onClick={onBackToMenu}>
              Back to menu
            </button>
          </div>
        ) : null}
      </section>

      {!hasSubmitted ? (
        <BlendControls
          blendedColor={blendedColor}
          onBlendedColorChange={setBlendedColor}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}
    </>
  );
}