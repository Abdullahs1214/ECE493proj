import ResultsPanel from "../components/ResultsPanel";
import type { GameplayResult, GameplayRound } from "../types/game";

interface ResultsContainerProps {
  round: GameplayRound;
  results: GameplayResult[];
}


export default function ResultsContainer({ round, results }: ResultsContainerProps) {
  return <ResultsPanel round={round} results={results} />;
}
