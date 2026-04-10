import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
            joinPolicy: "open",
            waitingPolicy: "late_join_waiting_allowed",
            hostPlayerId: "player-1",
            hostDisplayName: "Host Player",
            members: [
              {
                roomMembershipId: "membership-1",
                membershipStatus: "active",
                joinedAt: "2026-03-31T00:00:00Z",
                player: { playerId: "player-1", displayName: "Host Player", identityType: "guest" },
              },
              {
                roomMembershipId: "membership-2",
                membershipStatus: "active",
                joinedAt: "2026-03-31T00:00:00Z",
                player: { playerId: "player-2", displayName: "Player 2", identityType: "guest" },
              },
            ],
          },
        }),
      })
      // getCurrentRoom after createRoom effect re-runs
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          room: {
            roomId: "room-1",
            roomStatus: "open",
            joinPolicy: "open",
            waitingPolicy: "late_join_waiting_allowed",
            hostPlayerId: "player-1",
            hostDisplayName: "Host Player",
            members: [
              {
                roomMembershipId: "membership-1",
                membershipStatus: "active",
                joinedAt: "2026-03-31T00:00:00Z",
                player: { playerId: "player-1", displayName: "Host Player", identityType: "guest" },
              },
              {
                roomMembershipId: "membership-2",
                membershipStatus: "active",
                joinedAt: "2026-03-31T00:00:00Z",
                player: { playerId: "player-2", displayName: "Player 2", identityType: "guest" },
              },
            ],
          },
        }),
      })
      // getRooms after createRoom effect re-runs
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ rooms: [] }),
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
            totalRounds: 3,
            canAdvance: false,
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
            matchLeaderboard: null,
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
            totalRounds: 3,
            canAdvance: false,
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
            matchLeaderboard: null,
          },
        }),
      }),
  );

  const view = render(
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
      currentPlayerId="player-1"
    />,
  );

  await waitFor(() => {
    expect(screen.getByText("No active rooms. Create one!")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Create room"));

  await waitFor(() => {
    expect(
      within(view.container).getByText(
        (_, element) => element?.tagName === "P" && (element.textContent?.includes("Status: open") ?? false),
      ),
    ).toBeInTheDocument();
  });

  expect(
    within(view.container).getByText(
      (_, element) => element?.tagName === "P" && (element.textContent?.includes("Host: Host Player") ?? false),
    ),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByText("Start game"));

  await waitFor(() => {
    expect(screen.getByText("Blend Your Color")).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
