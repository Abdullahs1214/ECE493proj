import { act, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const hookMocks = vi.hoisted(() => ({
  useRoomState: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  startGameplay: vi.fn(),
}));

const childProps = vi.hoisted(() => ({
  lobby: null as any,
}));

vi.mock("../../src/hooks/useRoomState", () => hookMocks);
vi.mock("../../src/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    startGameplay: apiMocks.startGameplay,
  };
});
vi.mock("../../src/components/LobbyPanel", () => ({
  default: (props: any) => {
    childProps.lobby = props;
    return <div>Mock Lobby Panel</div>;
  },
}));

import LobbyContainer from "../../src/containers/LobbyContainer";

test("LobbyContainer covers guarded start/delete/join-by-id branches through child callbacks", async () => {
  const setErrorMessage = vi.fn();
  const setActiveMatchId = vi.fn();

  hookMocks.useRoomState.mockReturnValue({
    room: {
      roomId: "room-1",
      roomStatus: "open",
      joinPolicy: "open",
      waitingPolicy: "late_join_waiting_allowed",
      hostPlayerId: "player-1",
      hostDisplayName: "Host",
      members: [
        {
          roomMembershipId: "m1",
          membershipStatus: "active",
          joinedAt: "2026-04-01T00:00:00Z",
          player: { playerId: "player-1", identityType: "guest", displayName: "Host" },
        },
      ],
    },
    availableRooms: [],
    activeMatchId: null,
    errorMessage: null,
    setErrorMessage,
    setActiveMatchId,
    createRoom: vi.fn(),
    joinRoom: vi.fn().mockRejectedValueOnce("join by id failed"),
    leaveRoom: vi.fn(),
    deleteRoom: vi.fn().mockRejectedValueOnce("delete failed"),
  });

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

  expect(screen.getByText("Mock Lobby Panel")).toBeInTheDocument();

  await act(async () => {
    await childProps.lobby.onStartGameplay();
  });
  expect(setErrorMessage).toHaveBeenCalledWith("At least two active players are required to start gameplay.");

  await act(async () => {
    await childProps.lobby.onJoinRoomById("room-2");
  });
  expect(setErrorMessage).toHaveBeenCalledWith("Unable to join room.");

  await act(async () => {
    await childProps.lobby.onDeleteRoom();
  });
  expect(setErrorMessage).toHaveBeenCalledWith("Unable to delete room.");

  expect(apiMocks.startGameplay).not.toHaveBeenCalled();
  expect(setActiveMatchId).not.toHaveBeenCalled();
});

test("LobbyContainer covers back-to-menu wrapper and successful join-by-id", async () => {
  const onBackToMenu = vi.fn();
  const joinRoom = vi.fn().mockResolvedValue(undefined);

  hookMocks.useRoomState.mockReturnValue({
    room: null,
    availableRooms: [],
    activeMatchId: null,
    errorMessage: null,
    setErrorMessage: vi.fn(),
    setActiveMatchId: vi.fn(),
    createRoom: vi.fn(),
    joinRoom,
    leaveRoom: vi.fn(),
    deleteRoom: vi.fn(),
  });

  render(
    <LobbyContainer
      session={{
        sessionId: "session-2",
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
      onBackToMenu={onBackToMenu}
    />,
  );

  expect(screen.getByRole("button", { name: "Back to menu" })).toBeInTheDocument();

  await act(async () => {
    await childProps.lobby.onJoinRoomById("room-9");
  });

  expect(joinRoom).toHaveBeenCalledWith("room-9");
});

test("LobbyContainer covers successful deleteRoom branch", async () => {
  const deleteRoom = vi.fn().mockResolvedValue(undefined);

  hookMocks.useRoomState.mockReturnValue({
    room: {
      roomId: "room-1",
      roomStatus: "open",
      joinPolicy: "open",
      waitingPolicy: "late_join_waiting_allowed",
      hostPlayerId: "player-1",
      hostDisplayName: "Host",
      members: [
        {
          roomMembershipId: "m1",
          membershipStatus: "active",
          joinedAt: "2026-04-01T00:00:00Z",
          player: { playerId: "player-1", identityType: "guest", displayName: "Host" },
        },
      ],
    },
    availableRooms: [],
    activeMatchId: null,
    errorMessage: null,
    setErrorMessage: vi.fn(),
    setActiveMatchId: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    deleteRoom,
  });

  render(
    <LobbyContainer
      session={{
        sessionId: "session-3",
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

  await act(async () => {
    await childProps.lobby.onDeleteRoom();
  });

  expect(deleteRoom).toHaveBeenCalled();
});

test("LobbyContainer passes active-match delete guard text through to LobbyPanel", () => {
  hookMocks.useRoomState.mockReturnValue({
    room: {
      roomId: "room-1",
      roomStatus: "open",
      joinPolicy: "open",
      waitingPolicy: "late_join_waiting_allowed",
      hostPlayerId: "player-1",
      hostDisplayName: "Host",
      members: [
        {
          roomMembershipId: "m1",
          membershipStatus: "active",
          joinedAt: "2026-04-01T00:00:00Z",
          player: { playerId: "player-1", identityType: "guest", displayName: "Host" },
        },
        {
          roomMembershipId: "m2",
          membershipStatus: "active",
          joinedAt: "2026-04-01T00:00:00Z",
          player: { playerId: "player-2", identityType: "guest", displayName: "Guest" },
        },
      ],
    },
    availableRooms: [],
    activeMatchId: null,
    errorMessage: null,
    setErrorMessage: vi.fn(),
    setActiveMatchId: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    deleteRoom: vi.fn(),
  });

  render(
    <LobbyContainer
      session={{
        sessionId: "session-4",
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

  expect(childProps.lobby.room.roomStatus).toBe("open");
});
