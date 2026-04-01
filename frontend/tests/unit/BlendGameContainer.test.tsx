import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import BlendGameContainer from "../../src/containers/BlendGameContainer";


test("starts gameplay and submits a blended color", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        gameplay: {
          matchId: "match-1",
          mode: "single_player",
          matchStatus: "active_round",
          currentRoundNumber: 1,
          round: {
            roundId: "round-1",
            roundNumber: 1,
            roundStatus: "active_blending",
            targetColor: [80, 90, 100],
            baseColorSet: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
            timeLimit: 60,
            remainingSeconds: 59,
          },
          submissions: [],
          results: [],
        },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        gameplay: {
          matchId: "match-1",
          mode: "single_player",
          matchStatus: "results",
          currentRoundNumber: 1,
          round: {
            roundId: "round-1",
            roundNumber: 1,
            roundStatus: "results",
            targetColor: [80, 90, 100],
            baseColorSet: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
            timeLimit: 60,
            remainingSeconds: 0,
          },
          submissions: [],
          results: [
            {
              playerId: "player-1",
              displayName: "Player One",
              blendedColor: [80, 90, 100],
              colorDistance: 0,
              score: 1000,
              similarityPercentage: 100,
              rank: 1,
              tieBreakBasis: "exact_unrounded_color_distance",
            },
          ],
        },
      }),
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<BlendGameContainer mode="single_player" />);

  await waitFor(() => {
    expect(screen.getByText("Blend Your Color")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Submit color"));

  await waitFor(() => {
    expect(screen.getByText("Round Results")).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
