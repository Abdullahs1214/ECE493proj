import { useState } from "react";

import ResultsPanel from "../components/ResultsPanel";
import { advanceRound } from "../services/apiClient";
import type {
  GameMode,
  GameplayResult,
  GameplayRound,
  GameplayState,
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
  isHost?: boolean;
  currentPlayerId?: string;
  onAdvance?: (nextState: GameplayState) => void;
  onBackToLobby?: () => void;
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
  isHost = true,
  currentPlayerId,
  onAdvance,
  onBackToLobby,
  onBackToMenu,
}: ResultsContainerProps) {
  const [social, setSocial] = useState<SocialInteractionState | undefined>(undefined);
  const [isAdvancing, setIsAdvancing] = useState(false);

  function handlePlayAgain() {
    if (onBackToMenu) {
      onBackToMenu();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("restart-game"));
      }, 0);
    }
  }

  async function handleNextRound() {
    if (isAdvancing || !onAdvance) return;
    setIsAdvancing(true);
    try {
      const nextState = await advanceRound(matchId);
      onAdvance(nextState);
    } finally {
      setIsAdvancing(false);
    }
  }

  return (
    <>
      <ResultsPanel round={round} results={results} social={social} />

      {mode === "single_player" ? (
        <section className="status-card">
          <p>
            Round {currentRoundNumber} of {totalRounds} complete.{" "}
            {canAdvance ? "Ready for the next round." : "Match complete!"}
          </p>
          <div className="actions">
            {canAdvance ? (
              <button type="button" onClick={handleNextRound} disabled={isAdvancing}>
                {isAdvancing ? "Starting..." : "Next Round"}
              </button>
            ) : (
              <button type="button" onClick={handlePlayAgain}>
                Play another match
              </button>
            )}
            <button type="button" onClick={onBackToMenu}>
              Back to menu
            </button>
          </div>
        </section>
      ) : (
        <>
          {canAdvance ? (
            <section className="status-card">
              <p>Round {currentRoundNumber} of {totalRounds} complete.</p>
              {isHost ? (
                <div className="actions">
                  <button type="button" onClick={handleNextRound} disabled={isAdvancing}>
                    {isAdvancing ? "Starting..." : "Start Next Round"}
                  </button>
                </div>
              ) : (
                <p style={{ opacity: 0.6, fontStyle: "italic" }}>
                  Waiting for the host to start the next round...
                </p>
              )}
            </section>
          ) : (
            <section className="status-card">
              <p>Match complete! The room is open — the host can start another game.</p>
              <div className="actions">
                {onBackToLobby ? (
                  <button type="button" onClick={onBackToLobby}>
                    Back to Lobby
                  </button>
                ) : null}
                {onBackToMenu ? (
                  <button type="button" onClick={onBackToMenu}>
                    Back to menu
                  </button>
                ) : null}
              </div>
            </section>
          )}
          <SocialPanelContainer matchId={matchId} currentPlayerId={currentPlayerId} onStateChange={setSocial} />
        </>
      )}
    </>
  );
}
