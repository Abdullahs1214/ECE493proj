import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import SocialPanelContainer from "../../src/containers/SocialPanelContainer";


test("renders social state and submits a preset message", async () => {
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
          crowdFavorite: null,
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
          crowdFavorite: null,
        },
      }),
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<SocialPanelContainer matchId="match-1" />);

  await waitFor(() => {
    expect(screen.getByText("Social Interaction")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: "Nice blend!" }));

  await waitFor(() => {
    expect(screen.getByText(/Nice blend!/)).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
