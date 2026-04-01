import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import ResultsContainer from "../../src/containers/ResultsContainer";


class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;

  readyState = MockWebSocket.OPEN;

  constructor(_url: string) {}

  addEventListener() {}

  close() {
    this.readyState = 3;
  }
}


test("renders gameplay results with social state integration", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        social: {
          presetMessages: ["Nice blend!", "Great match!", "So close!"],
          interactions: [],
          submissionSummaries: [
            {
              submissionId: "submission-1",
              playerId: "player-1",
              displayName: "Winner",
              upvoteCount: 2,
              highlightCount: 1,
              hasUpvoted: false,
              hasHighlighted: false,
            },
          ],
          crowdFavorite: {
            submissionId: "submission-1",
            playerId: "player-1",
            displayName: "Winner",
            reactionCount: 3,
            upvoteCount: 2,
            highlightCount: 1,
          },
        },
      }),
    }),
  );

  render(
    <ResultsContainer
      matchId="match-1"
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

  await waitFor(() => {
    expect(screen.getByText(/3 reactions/)).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
