import type { GameplayResult, GameplayRound, SocialInteractionState } from "../types/game";

interface ResultsPanelProps {
  round: GameplayRound;
  results: GameplayResult[];
  social?: SocialInteractionState;
}


export default function ResultsPanel({ round, results, social }: ResultsPanelProps) {
  return (
    <section className="status-card">
      <p className="eyebrow">Results</p>
      <h2>Round Results</h2>
      <p>
        Target color: rgb({round.targetColor.join(", ")})
      </p>
      {social?.crowdFavorite ? (
        <p>Crowd favorite: {social.crowdFavorite.displayName}</p>
      ) : null}
      <ol className="member-list">
        {results.map((result) => (
          <li key={result.playerId}>
            {result.rank}. {result.displayName} - {result.score} points -{" "}
            {result.similarityPercentage}% similarity
          </li>
        ))}
      </ol>
    </section>
  );
}
