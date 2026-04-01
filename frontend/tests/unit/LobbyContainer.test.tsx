import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import LobbyContainer from "../../src/containers/LobbyContainer";


test("creates a room and shows host and members in the lobby", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        room: {
          roomId: "room-1",
          roomStatus: "open",
          hostPlayerId: "player-1",
          hostDisplayName: "Host Player",
          members: [
            {
              roomMembershipId: "membership-1",
              membershipStatus: "active",
              joinedAt: "2026-03-31T00:00:00Z",
              player: {
                playerId: "player-1",
                displayName: "Host Player",
                identityType: "guest",
              },
            },
          ],
        },
      }),
    }),
  );

  render(
    <LobbyContainer
      session={{
        sessionId: "session-1",
        sessionType: "guest",
        status: "active",
        lastActivityAt: "2026-03-31T00:00:00Z",
        player: {
          playerId: "player-1",
          identityType: "guest",
          displayName: "Host Player",
          profileAvatar: "",
        },
      }}
    />,
  );

  fireEvent.click(screen.getByText("Create room"));

  await waitFor(() => {
    expect(screen.getByText("Room ID: room-1")).toBeInTheDocument();
  });

  expect(screen.getByText("Host: Host Player")).toBeInTheDocument();
  expect(screen.getByText("Host Player (Host)")).toBeInTheDocument();

  vi.unstubAllGlobals();
});
