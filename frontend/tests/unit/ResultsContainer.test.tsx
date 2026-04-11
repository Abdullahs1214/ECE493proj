import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import ResultsContainer from "../../src/containers/ResultsContainer";

const resultsApiMock = vi.hoisted(() => ({
  advanceRound: vi.fn(),
}));

vi.mock("../../src/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    advanceRound: resultsApiMock.advanceRound,
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  resultsApiMock.advanceRound.mockReset();
});


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
          crowdFavorites: [
            {
              submissionId: "submission-1",
              playerId: "player-1",
              displayName: "Winner",
              reactionCount: 3,
              upvoteCount: 2,
              highlightCount: 1,
            },
          ],
        },
      }),
    }),
  );

  render(
    <ResultsContainer
      matchId="match-1"
      mode="multiplayer"
      currentRoundNumber={1}
      totalRounds={3}
      canAdvance={false}
      matchLeaderboard={null}
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
  expect(screen.getAllByText(/Winner/).length).toBeGreaterThan(0);

  await waitFor(() => {
    expect(screen.getByText(/3 reactions/)).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});

test("ResultsContainer covers single-player and multiplayer guard branches", async () => {
  const onBackToMenu = vi.fn();
  const onBackToLobby = vi.fn();

  const view = render(
    <ResultsContainer
      matchId="match-2"
      mode="single_player"
      currentRoundNumber={1}
      totalRounds={2}
      canAdvance={false}
      matchLeaderboard={null}
      round={{
        roundId: "round-2",
        roundNumber: 2,
        roundStatus: "results",
        targetColor: [10, 20, 30],
        baseColorSet: [[255, 0, 0]],
        timeLimit: 60,
        remainingSeconds: 0,
      }}
      results={[]}
      onBackToMenu={onBackToMenu}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Play another match" }));
  fireEvent.click(screen.getByRole("button", { name: "Back to menu" }));
  expect(onBackToMenu).toHaveBeenCalled();

  render(
    <ResultsContainer
      matchId="match-3"
      mode="multiplayer"
      currentRoundNumber={1}
      totalRounds={2}
      canAdvance={true}
      isHost={false}
      matchLeaderboard={null}
      round={{
        roundId: "round-3",
        roundNumber: 1,
        roundStatus: "results",
        targetColor: [10, 20, 30],
        baseColorSet: [[255, 0, 0]],
        timeLimit: 60,
        remainingSeconds: 0,
      }}
      results={[]}
      onBackToLobby={onBackToLobby}
    />,
  );

  expect(screen.getByText("Waiting for the host to start the next round...")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Start Next Round" })).not.toBeInTheDocument();
  expect(onBackToLobby).not.toHaveBeenCalled();
});

test("ResultsContainer clears the restart timer on unmount", () => {
  vi.useFakeTimers();
  const onBackToMenu = vi.fn();
  const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

  const view = render(
    <ResultsContainer
      matchId="match-cleanup"
      mode="single_player"
      currentRoundNumber={1}
      totalRounds={1}
      canAdvance={false}
      matchLeaderboard={null}
      round={{
        roundId: "round-cleanup",
        roundNumber: 1,
        roundStatus: "results",
        targetColor: [10, 20, 30],
        baseColorSet: [[255, 0, 0]],
        timeLimit: 60,
        remainingSeconds: 0,
      }}
      results={[]}
      onBackToMenu={onBackToMenu}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Play another match" }));
  view.unmount();

  expect(clearTimeoutSpy).toHaveBeenCalled();

  clearTimeoutSpy.mockRestore();
});

test("ResultsContainer covers next-round guard and starting label", async () => {
  let releaseAdvance: ((value: unknown) => void) | undefined;
  const onAdvance = vi.fn();
  resultsApiMock.advanceRound.mockImplementation(
    () =>
      new Promise((resolve) => {
        releaseAdvance = resolve;
      }),
  );

  render(
    <ResultsContainer
      matchId="match-4"
      mode="multiplayer"
      currentRoundNumber={1}
      totalRounds={2}
      canAdvance={true}
      isHost={true}
      matchLeaderboard={null}
      round={{
        roundId: "round-4",
        roundNumber: 1,
        roundStatus: "results",
        targetColor: [10, 20, 30],
        baseColorSet: [[255, 0, 0]],
        timeLimit: 60,
        remainingSeconds: 0,
      }}
      results={[]}
      onAdvance={onAdvance}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Start Next Round" }));
  expect(screen.getByRole("button", { name: "Starting..." })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Starting..." }));
  expect(resultsApiMock.advanceRound).toHaveBeenCalledTimes(1);

  releaseAdvance?.({ matchId: "next-match" });
  await waitFor(() => {
    expect(onAdvance).toHaveBeenCalledWith({ matchId: "next-match" });
  });
});
