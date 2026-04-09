import { useEffect, useState } from "react";

import BlendControls from "../components/BlendControls";
import { useGameplayState } from "../hooks/useGameplayState";
import type { GameMode } from "../types/game";
import ResultsContainer from "./ResultsContainer";

function defaultMixWeights(colorCount: number) {
  return Array.from({ length: colorCount }, () => 0);
}

function blendFromWeights(baseColorSet: number[][], mixWeights: number[]) {
  if (!baseColorSet.length) {
    return [0, 0, 0];
  }

  const totalWeight = mixWeights.reduce((sum, weight) => sum + weight, 0);
  const resolvedWeights =
    totalWeight > 0 ? mixWeights : Array.from({ length: baseColorSet.length }, () => 1);
  const resolvedTotalWeight =
    totalWeight > 0 ? totalWeight : resolvedWeights.reduce((sum, weight) => sum + weight, 0);

  return [0, 1, 2].map((channelIndex) =>
    Math.round(
      baseColorSet.reduce(
        (sum, sourceColor, colorIndex) =>
          sum + sourceColor[channelIndex] * (resolvedWeights[colorIndex] ?? 0),
        0,
      ) / resolvedTotalWeight,
    ),
  );
}

interface BlendGameContainerProps {
  mode: GameMode;
  roomId?: string;
  initialMatchId?: string;
  currentPlayerId: string;
  hostPlayerId?: string;
  onBackToLobby?: () => void;
  onBackToMenu?: () => void;
}

export default function BlendGameContainer({
  mode,
  roomId,
  initialMatchId,
  currentPlayerId,
  hostPlayerId,
  onBackToLobby,
  onBackToMenu,
}: BlendGameContainerProps) {
  const { gameplay, setGameplay, errorMessage, isLoading, submitColor } = useGameplayState({
    mode,
    roomId,
    initialMatchId,
  });

  const [mixWeights, setMixWeights] = useState<number[]>([]);
  const [hasLocallySubmitted, setHasLocallySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const blendedColor = gameplay
    ? blendFromWeights(gameplay.round.baseColorSet, mixWeights)
    : [128, 128, 128];

  useEffect(() => {
    if (!gameplay) {
      return;
    }
    setHasLocallySubmitted(false);
    setIsSubmitting(false);
    setMixWeights(defaultMixWeights(gameplay.round.baseColorSet.length));
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
        currentRoundNumber={gameplay.currentRoundNumber}
        totalRounds={gameplay.totalRounds}
        canAdvance={gameplay.canAdvance}
        isHost={mode === "single_player" || currentPlayerId === hostPlayerId}
        currentPlayerId={currentPlayerId}
        onAdvance={(nextState) => setGameplay(nextState)}
        onBackToLobby={onBackToLobby}
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
      await submitColor(mixWeights);
      setHasLocallySubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetBlend() {
    setMixWeights(defaultMixWeights(gameplay.round.baseColorSet.length));
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
          <p>Blend your colors to match the target as closely as possible.</p>
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
          baseColorSet={gameplay.round.baseColorSet}
          mixWeights={mixWeights}
          blendedColor={blendedColor}
          onMixWeightsChange={setMixWeights}
          onReset={handleResetBlend}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
        />
      ) : null}
    </>
  );
}
