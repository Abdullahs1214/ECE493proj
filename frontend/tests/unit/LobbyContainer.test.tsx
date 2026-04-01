import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import LobbyContainer from "../../src/containers/LobbyContainer";


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


test("creates a room and shows host and members in the lobby", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          gameplay: {
            matchId: "match-1",
            mode: "multiplayer",
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
            mode: "multiplayer",
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

  fireEvent.click(screen.getByText("Start gameplay"));

  await waitFor(() => {
    expect(screen.getByText("Blend Your Color")).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
