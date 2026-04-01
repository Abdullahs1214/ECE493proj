import { useState } from "react";

import BlendControls from "../components/BlendControls";
import TimerDisplay from "../components/TimerDisplay";
import { useGameplayState } from "../hooks/useGameplayState";
import type { GameMode } from "../types/game";
import ResultsContainer from "./ResultsContainer";

interface BlendGameContainerProps {
  mode: GameMode;
  roomId?: string;
}


export default function BlendGameContainer({ mode, roomId }: BlendGameContainerProps) {
  const { gameplay, errorMessage, isLoading, submitColor } = useGameplayState({ mode, roomId });
  const [blendedColor, setBlendedColor] = useState<number[]>([128, 128, 128]);

  if (isLoading) {
    return <section className="status-card">Loading gameplay...</section>;
  }

  if (errorMessage || !gameplay) {
    return <section className="status-card">{errorMessage ?? "Gameplay unavailable."}</section>;
  }

  if (gameplay.matchStatus === "results" || gameplay.matchStatus === "ended") {
    return <ResultsContainer round={gameplay.round} results={gameplay.results} />;
  }

  return (
    <>
      <TimerDisplay remainingSeconds={gameplay.round.remainingSeconds} />
      <section className="status-card">
        <p className="eyebrow">Target</p>
        <h2>Current Round</h2>
        <p>
          Target color: rgb({gameplay.round.targetColor.join(", ")})
        </p>
      </section>
      <BlendControls
        blendedColor={blendedColor}
        onBlendedColorChange={setBlendedColor}
        onSubmit={() => submitColor(blendedColor)}
      />
    </>
  );
}
