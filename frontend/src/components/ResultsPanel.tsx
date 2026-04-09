import type { GameplayResult, GameplayRound, SocialInteractionState } from "../types/game";

interface ResultsPanelProps {
  round: GameplayRound;
  results: GameplayResult[];
  social?: SocialInteractionState;
}

export default function ResultsPanel({ round, results, social }: ResultsPanelProps) {
  const winner = results.find((result) => result.rank === 1) ?? results[0] ?? null;

  // Only show tie-break info when two or more players share the same score
  const scores = results.map((r) => r.score);
  const hasTie = scores.length > 1 && new Set(scores).size < scores.length;

  function closenessLabel(similarityPercentage: number) {
    if (similarityPercentage >= 95) return "Excellent match";
    if (similarityPercentage >= 80) return "Close match";
    return "Room to improve";
  }

  return (
    <section className="status-card">
      <p className="eyebrow">Results</p>
      <h2>Round Results</h2>
      <p>Round {round.roundNumber}</p>
      <p>Target color: rgb({round.targetColor.join(", ")})</p>

      <div
        className="color-preview"
        style={{
          backgroundColor: `rgb(${round.targetColor[0]}, ${round.targetColor[1]}, ${round.targetColor[2]})`,
        }}
      />

      {winner ? (
        <div className="result-highlight">
          <strong>Winner: {winner.displayName}</strong>
          <p>
            {winner.score} points with a {winner.similarityPercentage}% match.
          </p>
        </div>
      ) : null}

      {hasTie ? <p>Tie-break rule: exact unrounded color distance to the target.</p> : null}

      {social?.crowdFavorites && social.crowdFavorites.length > 0 ? (
        <p>
          Crowd favorite{social.crowdFavorites.length > 1 ? "s (tied)" : ""}:{" "}
          {social.crowdFavorites.map((f) => f.displayName).join(", ")}
        </p>
      ) : null}

      <ul className="member-list">
        {results.map((result) => {
          const isWinner = result.rank === 1;
          const color = result.blendedColor
            ? `rgb(${result.blendedColor[0]}, ${result.blendedColor[1]}, ${result.blendedColor[2]})`
            : null;

          return (
            <li key={result.playerId} className={isWinner ? "result-row result-row--winner" : "result-row"}>
              <p style={{ fontWeight: isWinner ? 700 : 400 }}>
                #{result.rank} {result.displayName}
                {isWinner ? " — Winner" : ""}
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
              <p style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                Submitted:{" "}
                {color ? (
                  <>
                    rgb({result.blendedColor!.join(", ")})
                    <span
                      className="result-swatch"
                      style={{ backgroundColor: color }}
                      aria-label={`Submitted color: ${color}`}
                    />
                  </>
                ) : (
                  "No submission"
                )}
              </p>
              <p>Distance from target: {result.colorDistance.toFixed(2)}</p>
              {hasTie ? (
                <p>Tie-break basis: {result.tieBreakBasis.replaceAll("_", " ")}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
