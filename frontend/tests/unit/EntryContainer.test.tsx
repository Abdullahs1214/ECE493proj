import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        history: {
          roomScopedHistory: [],
          identityScopedHistory: [],
        },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ room: null }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rooms: [] }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        room: {
          roomId: "room-1",
          roomStatus: "open",
          hostPlayerId: "player-1",
          hostDisplayName: "Guest 1",
          members: [
            {
              roomMembershipId: "membership-1",
              membershipStatus: "active",
              joinedAt: "2026-03-31T00:00:00Z",
              player: {
                playerId: "player-1",
                displayName: "Guest 1",
                identityType: "guest",
              },
            },
          ],
        },
      }),
    });
  vi.stubGlobal("fetch", fetchMock);

  const view = render(<EntryContainer />);

  await waitFor(() => {
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  // Switch to guest tab then click Continue as guest
  fireEvent.click(screen.getByRole("button", { name: "Guest" }));
  fireEvent.click(screen.getByText("Continue as guest"));

  await waitFor(() => {
    expect(screen.getByText("Guest 1")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Multiplayer"));
  await waitFor(() => {
    expect(screen.getByText("Multiplayer Room")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Create room"));

  await waitFor(() => {
    expect(
      within(view.container).getByText(
        (_, element) => element?.tagName === "P" && (element.textContent?.includes("Status: open") ?? false),
      ),
    ).toBeInTheDocument();
  });

  view.unmount();
  vi.unstubAllGlobals();
});
