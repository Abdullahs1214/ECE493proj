import { useState } from "react";

import ResultsPanel from "../components/ResultsPanel";
import type {
  GameMode,
  GameplayResult,
  GameplayRound,
  SocialInteractionState,
} from "../types/game";
import SocialPanelContainer from "./SocialPanelContainer";

interface ResultsContainerProps {
  matchId: string;
  round: GameplayRound;
  results: GameplayResult[];
  mode: GameMode;
  onBackToMenu?: () => void;
}

export default function ResultsContainer({
  matchId,
  round,
  results,
  mode,
  onBackToMenu,
}: ResultsContainerProps) {
  const [social, setSocial] = useState<SocialInteractionState | undefined>(undefined);

  function handlePlayAgain() {
    if (onBackToMenu) {
      onBackToMenu();

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("restart-game"));
      }, 0);
    }
  }

  return (
    <>
      <ResultsPanel round={round} results={results} social={social} />

      {mode === "single_player" ? (
        <section className="status-card">
          <div className="actions">
            <button type="button" onClick={handlePlayAgain}>
              Play another round
            </button>
            <button type="button" onClick={onBackToMenu}>
              Back to menu
            </button>
          </div>
        </section>
      ) : (
        <>
          <SocialPanelContainer matchId={matchId} onStateChange={setSocial} />
          {onBackToMenu ? (
            <section className="status-card">
              <div className="actions">
                <button type="button" onClick={onBackToMenu}>
                  Back to menu
                </button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}