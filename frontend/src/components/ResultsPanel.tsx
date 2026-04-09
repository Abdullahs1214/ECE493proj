import type { GameplayResult, GameplayRound, SocialInteractionState } from "../types/game";

interface ResultsPanelProps {
  round: GameplayRound;
  results: GameplayResult[];
  social?: SocialInteractionState;
}

export default function ResultsPanel({ round, results, social }: ResultsPanelProps) {
  const winner = results.find((result) => result.rank === 1) ?? results[0] ?? null;

  function closenessLabel(similarityPercentage: number) {
    if (similarityPercentage >= 95) {
      return "Excellent match";
    }
    if (similarityPercentage >= 80) {
      return "Close match";
    }
    return "Room to improve";
  }

  return (
    <section className="status-card">
      <p className="eyebrow">Results</p>
      <h2>Round Results</h2>
      <p>Round {round.roundNumber}</p>
      <p>Target color: rgb({round.targetColor.join(", ")})</p>
      {winner ? (
        <div className="result-highlight">
          <strong>Winner: {winner.displayName}</strong>
          <p>
            {winner.score} points with a {winner.similarityPercentage}% match.
          </p>
        </div>
      ) : null}
      <p>Tie-break rule: exact unrounded color distance to the target.</p>

      {social?.crowdFavorite ? <p>Crowd favorite: {social.crowdFavorite.displayName}</p> : null}

      <ol className="member-list">
        {results.map((result) => (
          <li key={result.playerId} className={result.rank === 1 ? "result-row result-row--winner" : "result-row"}>
            <p>
              {result.rank}. {result.displayName}
              {result.rank === 1 ? " — Winner" : ""}
            </p>
            <p>
              {result.score} points — {result.similarityPercentage}% match —{" "}
              {closenessLabel(result.similarityPercentage)}
            </p>
            <div className="result-meter" aria-label={`${result.displayName} closeness meter`}>
              <div
                className="result-meter__fill"
                style={{ width: `${Math.max(0, Math.min(100, result.similarityPercentage))}%` }}
              />
            </div>
            <p>
              Submitted color:{" "}
              {result.blendedColor ? `rgb(${result.blendedColor.join(", ")})` : "No submission"}
            </p>
            <p>Distance from target: {result.colorDistance.toFixed(2)}</p>
            <p>Tie-break basis: {result.tieBreakBasis.replaceAll("_", " ")}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
