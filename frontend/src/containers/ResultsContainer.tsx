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
  currentRoundNumber: number;
  totalRounds: number;
  canAdvance: boolean;
  onBackToMenu?: () => void;
}

export default function ResultsContainer({
  matchId,
  round,
  results,
  mode,
  currentRoundNumber,
  totalRounds,
  canAdvance,
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
          {canAdvance ? (
            <p>
              Round {currentRoundNumber} of {totalRounds} complete. Next round starts
              automatically in a moment.
            </p>
          ) : (
            <p>Match complete.</p>
          )}
          <div className="actions">
            {!canAdvance ? (
              <button type="button" onClick={handlePlayAgain}>
                Play another match
              </button>
            ) : null}
            <button type="button" onClick={onBackToMenu}>
              Back to menu
            </button>
          </div>
        </section>
      ) : (
        <>
          {canAdvance ? (
            <section className="status-card">
              <p>
                Round {currentRoundNumber} of {totalRounds} complete. Next round starts shortly.
              </p>
            </section>
          ) : (
            <section className="status-card">
              <p>Multiplayer match complete. The room is open for the next game.</p>
            </section>
          )}
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
