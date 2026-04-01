import { useState } from "react";

import ResultsPanel from "../components/ResultsPanel";
import type { GameplayResult, GameplayRound, SocialInteractionState } from "../types/game";
import SocialPanelContainer from "./SocialPanelContainer";

interface ResultsContainerProps {
  matchId: string;
  round: GameplayRound;
  results: GameplayResult[];
}


export default function ResultsContainer({ matchId, round, results }: ResultsContainerProps) {
  const [social, setSocial] = useState<SocialInteractionState | undefined>(undefined);

  return (
    <>
      <ResultsPanel round={round} results={results} social={social} />
      <SocialPanelContainer matchId={matchId} onStateChange={setSocial} />
    </>
  );
}
