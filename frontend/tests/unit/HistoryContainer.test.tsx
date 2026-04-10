import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import HistoryContainer from "../../src/containers/HistoryContainer";


test("renders room-scoped and identity-scoped history", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        history: {
          roomScopedHistory: [
            {
              scoreHistoryEntryId: "history-1",
              historyScope: "room_scoped",
              roomId: "room-1",
              roundId: "round-1",
              scoreRecordId: "score-1",
              displayName: "Player One",
              score: 900,
              similarityPercentage: 90,
              rank: 1,
              targetColor: null,
              blendedColor: null,
              roundNumber: 1,
              matchMode: "single_player",
            },
          ],
          identityScopedHistory: [],
        },
      }),
    }),
  );

  render(<HistoryContainer />);

  await waitFor(() => {
    expect(screen.getByText("Score History")).toBeInTheDocument();
  });

  expect(screen.getByText(/900 pts/)).toBeInTheDocument();

  vi.unstubAllGlobals();
});
