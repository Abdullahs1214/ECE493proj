import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, test, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  startGameplay: vi.fn(),
}));

vi.mock("../../src/hooks/useRoomState", () => ({
  useRoomState: () => ({
    room: null,
    activeMatchId: null,
    errorMessage: null,
    setErrorMessage: vi.fn(),
    setActiveMatchId: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
  }),
}));

vi.mock("../../src/services/apiClient", () => ({
  startGameplay: apiClientMock.startGameplay,
}));

vi.mock("../../src/components/LobbyPanel", () => ({
  default: ({ onStartGameplay }: { onStartGameplay: () => void }) => {
    useEffect(() => {
      void onStartGameplay();
    }, [onStartGameplay]);

    return <p>Lobby panel</p>;
  },
}));

vi.mock("../../src/containers/BlendGameContainer", () => ({
  default: () => <p>blend game</p>,
}));

import LobbyContainer from "../../src/containers/LobbyContainer";

describe("LobbyContainer no-room branch", () => {
  test("does not start gameplay when no room exists", async () => {
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
            displayName: "Host",
            profileAvatar: "",
          },
        }}
        currentPlayerId="player-1"
      />,
    );

    await waitFor(() => {
      expect(apiClientMock.startGameplay).not.toHaveBeenCalled();
    });
  });
});
