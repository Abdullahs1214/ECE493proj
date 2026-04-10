import { useState } from "react";

import ResultsPanel from "../components/ResultsPanel";
import { advanceRound } from "../services/apiClient";
import type {
  GameMode,
  GameplayResult,
  GameplayRound,
  GameplayState,
  MatchLeaderboardEntry,
  SocialInteractionState,
} from "../types/game";
import SocialPanelContainer from "./SocialPanelContainer";

interface ResultsContainerProps {
  matchId: string;
  round: GameplayRound;
  results: GameplayResult[];
  matchLeaderboard: MatchLeaderboardEntry[] | null;
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
  matchLeaderboard,
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

      {/* Match-wide leaderboard — shown when the full match is over */}
      {matchLeaderboard && matchLeaderboard.length > 0 ? (
        <section className="status-card">
          <p className="eyebrow">Match Over</p>
          <h2>
            {matchLeaderboard[0].rank === 1
              ? `Overall Winner: ${matchLeaderboard.filter((e) => e.rank === 1).map((e) => e.displayName).join(" & ")}`
              : "Match Results"}
          </h2>
          <ul className="member-list">
            {matchLeaderboard.map((entry) => (
              <li key={entry.playerId} className={entry.rank === 1 ? "result-row result-row--winner" : "result-row"}>
                <p style={{ fontWeight: entry.rank === 1 ? 700 : 400 }}>
                  #{entry.rank} {entry.displayName}
                  {entry.rank === 1 ? " — Winner" : ""}
                </p>
                <p>{entry.totalScore} pts total across {totalRounds} rounds</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
