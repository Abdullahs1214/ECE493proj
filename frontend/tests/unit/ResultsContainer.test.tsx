import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import ResultsContainer from "../../src/containers/ResultsContainer";


test("renders gameplay results", () => {
  render(
    <ResultsContainer
      round={{
        roundId: "round-1",
        roundNumber: 1,
        roundStatus: "results",
        targetColor: [80, 90, 100],
        baseColorSet: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        timeLimit: 60,
        remainingSeconds: 0,
      }}
      results={[
        {
          playerId: "player-1",
          displayName: "Winner",
          blendedColor: [80, 90, 100],
          colorDistance: 0,
          score: 1000,
          similarityPercentage: 100,
          rank: 1,
          tieBreakBasis: "exact_unrounded_color_distance",
        },
      ]}
    />,
  );

  expect(screen.getByText("Round Results")).toBeInTheDocument();
  expect(screen.getByText(/Winner/)).toBeInTheDocument();
});
