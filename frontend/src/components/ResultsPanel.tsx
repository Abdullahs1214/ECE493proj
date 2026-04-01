import type { GameplayResult, GameplayRound } from "../types/game";

interface ResultsPanelProps {
  round: GameplayRound;
  results: GameplayResult[];
}


export default function ResultsPanel({ round, results }: ResultsPanelProps) {
  return (
    <section className="status-card">
      <p className="eyebrow">Results</p>
      <h2>Round Results</h2>
      <p>
        Target color: rgb({round.targetColor.join(", ")})
      </p>
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
