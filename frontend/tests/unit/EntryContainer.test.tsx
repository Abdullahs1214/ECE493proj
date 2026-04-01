import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import EntryContainer from "../../src/containers/EntryContainer";


test("supports guest entry and mode selection handoff", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "No active session." }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        session: {
          sessionId: "session-1",
          sessionType: "guest",
          status: "active",
          lastActivityAt: "2026-03-31T00:00:00Z",
          player: {
            playerId: "player-1",
            identityType: "guest",
            displayName: "Guest 1",
            profileAvatar: "",
          },
        },
      }),
    });
  vi.stubGlobal("fetch", fetchMock);

  render(<EntryContainer />);

  await waitFor(() => {
    expect(screen.getByText("Continue as guest")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Continue as guest"));

  await waitFor(() => {
    expect(screen.getByText("Signed in as: Guest 1")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Multiplayer"));

  expect(screen.getByText("Selected mode: Multiplayer")).toBeInTheDocument();

  vi.unstubAllGlobals();
});
