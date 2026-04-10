import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import SocialPanelContainer from "../../src/containers/SocialPanelContainer";


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


test("renders social state and submits a preset message", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
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
              displayName: "Player One",
              upvoteCount: 0,
              highlightCount: 0,
              hasUpvoted: false,
              hasHighlighted: false,
            },
          ],
          crowdFavorites: [],
        },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        social: {
          presetMessages: ["Nice blend!", "Great match!", "So close!"],
          interactions: [
            {
              socialInteractionId: "social-1",
              interactionType: "preset_message",
              playerId: "player-1",
              displayName: "Player One",
              targetSubmissionId: null,
              targetDisplayName: null,
              presetMessage: "Nice blend!",
            },
          ],
          submissionSummaries: [
            {
              submissionId: "submission-1",
              playerId: "player-1",
              displayName: "Player One",
              upvoteCount: 0,
              highlightCount: 0,
              hasUpvoted: false,
              hasHighlighted: false,
            },
          ],
          crowdFavorites: [],
        },
      }),
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<SocialPanelContainer matchId="match-1" />);

  // SocialPanel renders immediately (not waiting for fetch)
  expect(screen.getByRole("heading", { name: "Social" })).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Nice blend!" })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: "Nice blend!" }));

  await waitFor(() => {
    expect(screen.getAllByText(/Nice blend!/).length).toBeGreaterThan(0);
  });

  vi.unstubAllGlobals();
});
