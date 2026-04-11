import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";


const lobbyHookMock = vi.hoisted(() => ({
  useRoomState: vi.fn(),
}));

const sessionHookMock = vi.hoisted(() => ({
  useSessionState: vi.fn(),
}));

const modeHookMock = vi.hoisted(() => ({
  useModeSelection: vi.fn(),
}));

const apiClientMock = vi.hoisted(() => ({
  getHistory: vi.fn(),
  getSocialState: vi.fn(),
  submitSocialInteraction: vi.fn(),
  startGameplay: vi.fn(),
}));

const realtimeMock = vi.hoisted(() => ({
  subscribeToMatch: vi.fn(),
}));

vi.mock("../../src/hooks/useRoomState", () => lobbyHookMock);
vi.mock("../../src/hooks/useSessionState", () => sessionHookMock);
vi.mock("../../src/hooks/useModeSelection", () => modeHookMock);
vi.mock("../../src/services/apiClient", () => apiClientMock);
vi.mock("../../src/services/realtimeClient", () => realtimeMock);
vi.mock("../../src/containers/BlendGameContainer", () => ({
  default: ({ mode, roomId, initialMatchId }: { mode: string; roomId?: string; initialMatchId?: string }) => (
    <p>{`Blend:${mode}:${roomId ?? "none"}:${initialMatchId ?? "none"}`}</p>
  ),
}));

import EntryContainer from "../../src/containers/EntryContainer";
import HistoryContainer from "../../src/containers/HistoryContainer";
import LobbyContainer from "../../src/containers/LobbyContainer";
import SocialPanelContainer from "../../src/containers/SocialPanelContainer";


describe("container edge coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClientMock.getHistory.mockResolvedValue({
      roomScopedHistory: [],
      identityScopedHistory: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("LobbyContainer covers validation, error fallbacks, and active match handoff", async () => {
    const setErrorMessage = vi.fn();
    const setActiveMatchId = vi.fn();
    const createRoom = vi.fn().mockRejectedValueOnce("bad-create");
    const joinRoom = vi.fn().mockRejectedValueOnce("bad-join");
    const leaveRoom = vi.fn().mockRejectedValueOnce("bad-leave");

    lobbyHookMock.useRoomState.mockReturnValue({
      room: null,
      availableRooms: [],
      activeMatchId: null,
      errorMessage: "Existing error",
      setErrorMessage,
      setActiveMatchId,
      createRoom,
      joinRoom,
      leaveRoom,
      deleteRoom: vi.fn(),
    });
    apiClientMock.startGameplay.mockRejectedValueOnce("bad-start");

    const { rerender, container } = render(
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

    fireEvent.click(screen.getByText("Join room"));
    expect(setErrorMessage).toHaveBeenCalledWith("roomId is required.");

    fireEvent.click(screen.getByText("Create room"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("Unable to create room.");
    });

    fireEvent.change(screen.getByLabelText("Room ID"), { target: { value: " room-1 " } });
    fireEvent.click(screen.getByText("Join room"));
    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith("room-1");
    });
    expect(setErrorMessage).toHaveBeenCalledWith("Unable to join room.");

    const roomWith2Members = {
      roomId: "room-1",
      roomStatus: "open" as const,
      joinPolicy: "open" as const,
      waitingPolicy: "late_join_waiting_allowed" as const,
      hostPlayerId: "player-1",
      hostDisplayName: "Host",
      members: [
        { roomMembershipId: "m1", membershipStatus: "active" as const, joinedAt: "2026-03-31T00:00:00Z", player: { playerId: "player-1", identityType: "guest" as const, displayName: "Host" } },
        { roomMembershipId: "m2", membershipStatus: "active" as const, joinedAt: "2026-03-31T00:00:00Z", player: { playerId: "player-2", identityType: "guest" as const, displayName: "Guest" } },
      ],
    };
    lobbyHookMock.useRoomState.mockReturnValue({
      room: roomWith2Members,
      availableRooms: [],
      activeMatchId: null,
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId,
      createRoom,
      joinRoom,
      leaveRoom,
      deleteRoom: vi.fn(),
    });
    rerender(
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

    fireEvent.click(within(container).getByText("Leave room"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("Unable to leave room.");
    });

    fireEvent.click(within(container).getByText("Start game"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("Unable to start gameplay.");
    });

    lobbyHookMock.useRoomState.mockReturnValue({
      room: {
        roomId: "room-1",
        roomStatus: "open",
        joinPolicy: "open",
        waitingPolicy: "late_join_waiting_allowed",
        hostPlayerId: "player-1",
        hostDisplayName: "Host",
        members: [],
      },
      availableRooms: [],
      activeMatchId: "match-1",
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId,
      createRoom,
      joinRoom,
      leaveRoom,
      deleteRoom: vi.fn(),
    });
    rerender(
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

    expect(screen.getByText("Blend:multiplayer:room-1:match-1")).toBeInTheDocument();
  });

  test("LobbyContainer surfaces Error messages from room actions and gameplay start", async () => {
    const setErrorMessage = vi.fn();
    const createRoom = vi.fn().mockRejectedValueOnce(new Error("create failed"));
    const joinRoom = vi.fn().mockRejectedValueOnce(new Error("join failed"));
    const leaveRoom = vi.fn().mockRejectedValueOnce(new Error("leave failed"));
    const deleteRoom = vi.fn().mockRejectedValueOnce(new Error("delete failed"));
    lobbyHookMock.useRoomState.mockReturnValue({
      room: null,
      availableRooms: [],
      activeMatchId: null,
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId: vi.fn(),
      createRoom,
      joinRoom,
      leaveRoom,
      deleteRoom,
    });
    apiClientMock.startGameplay.mockRejectedValueOnce(new Error("start failed"));

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
            displayName: "Host",
            profileAvatar: "",
          },
        }}
        currentPlayerId="player-1"
      />,
    );

    fireEvent.click(view.getByText("Create room"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("create failed");
    });

    fireEvent.change(view.getByLabelText("Room ID"), { target: { value: "room-err" } });
    fireEvent.click(view.getByText("Join room"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("join failed");
    });

    const room2Members = {
      roomId: "room-err",
      roomStatus: "open" as const,
      joinPolicy: "open" as const,
      waitingPolicy: "late_join_waiting_allowed" as const,
      hostPlayerId: "player-1",
      hostDisplayName: "Host",
      members: [
        { roomMembershipId: "m1", membershipStatus: "active" as const, joinedAt: "2026-03-31T00:00:00Z", player: { playerId: "player-1", identityType: "guest" as const, displayName: "Host" } },
        { roomMembershipId: "m2", membershipStatus: "active" as const, joinedAt: "2026-03-31T00:00:00Z", player: { playerId: "player-2", identityType: "guest" as const, displayName: "Guest" } },
      ],
    };
    lobbyHookMock.useRoomState.mockReturnValue({
      room: room2Members,
      availableRooms: [],
      activeMatchId: null,
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId: vi.fn(),
      createRoom,
      joinRoom,
      leaveRoom,
      deleteRoom,
    });
    view.rerender(
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

    fireEvent.click(within(view.container).getByText("Leave room"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("leave failed");
    });

    fireEvent.click(within(view.container).getByText("Delete room"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("delete failed");
    });

    fireEvent.click(within(view.container).getByText("Start game"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("start failed");
    });
  });

  test("LobbyContainer covers join-by-id error branch", async () => {
    const setErrorMessage = vi.fn();
    const joinRoom = vi.fn().mockRejectedValueOnce(new Error("join by id failed"));
    lobbyHookMock.useRoomState.mockReturnValue({
      room: {
        roomId: "room-low",
        roomStatus: "open",
        joinPolicy: "open",
        waitingPolicy: "late_join_waiting_allowed",
        hostPlayerId: "player-1",
        hostDisplayName: "Host",
        members: [
          {
            roomMembershipId: "m1",
            membershipStatus: "active",
            joinedAt: "2026-03-31T00:00:00Z",
            player: { playerId: "player-1", identityType: "guest", displayName: "Host" },
          },
        ],
      },
      availableRooms: [],
      activeMatchId: null,
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId: vi.fn(),
      createRoom: vi.fn(),
      joinRoom,
      leaveRoom: vi.fn(),
      deleteRoom: vi.fn(),
    });

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
            displayName: "Host",
            profileAvatar: "",
          },
        }}
        currentPlayerId="player-1"
      />,
    );

    lobbyHookMock.useRoomState.mockReturnValue({
      room: null,
      availableRooms: [
        {
          roomId: "room-join",
          roomStatus: "open",
          joinPolicy: "open",
          waitingPolicy: "late_join_waiting_allowed",
          hostPlayerId: "player-2",
          hostDisplayName: "Other",
          members: [
            {
              roomMembershipId: "m2",
              membershipStatus: "active",
              joinedAt: "2026-03-31T00:00:00Z",
              player: { playerId: "player-2", identityType: "guest", displayName: "Other" },
            },
          ],
        },
      ],
      activeMatchId: null,
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId: vi.fn(),
      createRoom: vi.fn(),
      joinRoom,
      leaveRoom: vi.fn(),
      deleteRoom: vi.fn(),
    });
    view.rerender(
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

    fireEvent.click(within(view.container).getByText("Join"));
    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith("join by id failed");
    });
  });

  test("SocialPanelContainer covers initial load errors and realtime refresh", async () => {
    const onStateChange = vi.fn();
    let onMessage: ((message: any) => void) | undefined;

    apiClientMock.getSocialState
      .mockRejectedValueOnce("bad-social")
      .mockResolvedValueOnce({
        presetMessages: ["Nice blend!"],
        interactions: [],
        submissionSummaries: [],
        crowdFavorites: [],
      });
    realtimeMock.subscribeToMatch.mockImplementation((_matchId, messageHandler) => {
      onMessage = messageHandler;
      return vi.fn();
    });

    render(<SocialPanelContainer matchId="match-1" onStateChange={onStateChange} />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load social state.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Unable to load social state."));

    onMessage?.({ event: "timer_update" });
    expect(apiClientMock.getSocialState).toHaveBeenCalledTimes(1);

    onMessage?.({ event: "social_interaction_update" });
    await waitFor(() => {
      expect(onStateChange).toHaveBeenCalledWith({
        presetMessages: ["Nice blend!"],
        interactions: [],
        submissionSummaries: [],
        crowdFavorites: [],
      });
    });
  });

  test("SocialPanelContainer ignores initial load completion after unmount", async () => {
    let resolveInitial: ((value: unknown) => void) | undefined;

    apiClientMock.getSocialState.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveInitial = resolve;
        }),
    );
    realtimeMock.subscribeToMatch.mockReturnValue(vi.fn());

    const view = render(<SocialPanelContainer matchId="match-2" />);
    const { unmount, container } = view;
    unmount();

    await waitFor(() => {
      expect(resolveInitial).toBeTypeOf("function");
    });

    await Promise.resolve(
      resolveInitial?.({
        presetMessages: [],
        interactions: [],
        submissionSummaries: [],
        crowdFavorites: [],
      }),
    );

    expect(container.innerHTML).toBe("");
  });

  test("SocialPanelContainer handles realtime refresh errors", async () => {
    let onMessage: ((message: any) => void) | undefined;

    apiClientMock.getSocialState
      .mockResolvedValueOnce({
        presetMessages: [],
        interactions: [],
        submissionSummaries: [],
        crowdFavorites: [],
      })
      .mockRejectedValueOnce("bad-refresh");
    realtimeMock.subscribeToMatch.mockImplementation((_matchId, messageHandler) => {
      onMessage = messageHandler;
      return vi.fn();
    });

    const view = render(<SocialPanelContainer matchId="match-3" />);
    expect(view.container).toHaveTextContent("Social");
    onMessage?.({ event: "social_interaction_update" });

    await waitFor(() => {
      expect(view.getByText("Unable to load social state.")).toBeInTheDocument();
    });
  });

  test("SocialPanelContainer realtime refresh Error instance uses error.message (line 61)", async () => {
    let onMessage: ((message: unknown) => void) | undefined;

    apiClientMock.getSocialState
      .mockResolvedValueOnce({ presetMessages: [], interactions: [], submissionSummaries: [], crowdFavorites: [] })
      .mockRejectedValueOnce(new Error("realtime refresh failed"));
    realtimeMock.subscribeToMatch.mockImplementation((_matchId: string, handler: (m: unknown) => void) => {
      onMessage = handler;
      return vi.fn();
    });

    const view = render(<SocialPanelContainer matchId="match-rt-err" />);
    await waitFor(() => expect(apiClientMock.getSocialState).toHaveBeenCalledTimes(1));

    onMessage?.({ event: "social_interaction_update" });

    await waitFor(() => {
      expect(within(view.container).getByText("realtime refresh failed")).toBeInTheDocument();
    });
  });

  test("SocialPanelContainer submits upvote and highlight interactions", async () => {
    const onStateChange = vi.fn();
    apiClientMock.submitSocialInteraction
      .mockResolvedValueOnce({
        presetMessages: [],
        interactions: [{ socialInteractionId: "social-1", interactionType: "upvote" }],
        submissionSummaries: [],
        crowdFavorites: [],
      })
      .mockResolvedValueOnce({
        presetMessages: [],
        interactions: [{ socialInteractionId: "social-2", interactionType: "highlight" }],
        submissionSummaries: [],
        crowdFavorites: [],
      });
    realtimeMock.subscribeToMatch.mockReturnValue(vi.fn());

    apiClientMock.getSocialState.mockResolvedValueOnce({
      presetMessages: [],
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
    });

    const firstView = render(<SocialPanelContainer matchId="match-4" onStateChange={onStateChange} />);

    await waitFor(() => {
      expect(firstView.getByRole("button", { name: "Upvote" })).toBeInTheDocument();
    });

    fireEvent.click(firstView.getByRole("button", { name: "Upvote" }));
    await waitFor(() => {
      expect(apiClientMock.submitSocialInteraction).toHaveBeenCalledWith(
        "match-4",
        "upvote",
        "submission-1",
        undefined,
      );
    });
    firstView.unmount();

    apiClientMock.getSocialState.mockResolvedValueOnce({
      presetMessages: [],
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
    });

    const secondView = render(<SocialPanelContainer matchId="match-4" onStateChange={onStateChange} />);

    await waitFor(() => {
      expect(secondView.getByRole("button", { name: "Highlight" })).toBeInTheDocument();
    });

    fireEvent.click(secondView.getByRole("button", { name: "Highlight" }));
    await waitFor(() => {
      expect(apiClientMock.submitSocialInteraction).toHaveBeenCalledWith(
        "match-4",
        "highlight",
        "submission-1",
        undefined,
      );
    });
    expect(onStateChange).toHaveBeenCalledWith({
      presetMessages: [],
      interactions: [{ socialInteractionId: "social-2", interactionType: "highlight" }],
      submissionSummaries: [],
      crowdFavorites: [],
    });
  });

  test("HistoryContainer covers load failure fallback", async () => {
    apiClientMock.getHistory.mockRejectedValueOnce("bad-history");

    render(<HistoryContainer />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load history.")).toBeInTheDocument();
    });
  });

  test("HistoryContainer ignores resolved and rejected loads after unmount", async () => {
    let resolveHistory: ((value: unknown) => void) | undefined;
    let rejectHistory: ((reason?: unknown) => void) | undefined;
    apiClientMock.getHistory
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveHistory = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectHistory = reject;
          }),
      );

    const first = render(<HistoryContainer />);
    first.unmount();
    await Promise.resolve(resolveHistory?.({ roomScopedHistory: [], identityScopedHistory: [] }));
    expect(first.container.innerHTML).toBe("");

    const second = render(<HistoryContainer />);
    second.unmount();
    await Promise.resolve(rejectHistory?.(new Error("late history failure")));
    expect(second.container.innerHTML).toBe("");
  });

  test("EntryContainer covers blank rename, logout reset, and mode handoff branches", async () => {
    const enterAsGuest = vi.fn().mockResolvedValue(undefined);
    const renameGuest = vi.fn().mockResolvedValue(undefined);
    const clearSession = vi.fn().mockResolvedValue(undefined);
    const selectMode = vi.fn();
    const resetMode = vi.fn();
    lobbyHookMock.useRoomState.mockReturnValue({
      room: null,
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

    sessionHookMock.useSessionState.mockReturnValue({
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
      loadState: "ready",
      errorMessage: null,
      enterAsGuest,
      enterWithOAuth: vi.fn(),
      registerLocal: vi.fn(),
      loginLocal: vi.fn(),
      renameGuest,
      updateAvatar: vi.fn(),
      clearSession,
    });
    modeHookMock.useModeSelection.mockReturnValue({
      mode: null,
      selectMode,
      resetMode,
    });

    const view = render(<EntryContainer />);

    fireEvent.click(screen.getByText("Change name"));
    fireEvent.change(screen.getByLabelText("New display name"), { target: { value: "   " } });
    fireEvent.click(screen.getByText("Save name"));
    expect(renameGuest).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("New display name"), { target: { value: "Casey" } });
    fireEvent.click(screen.getByText("Save name"));
    await waitFor(() => {
      expect(renameGuest).toHaveBeenCalledWith("Casey");
    });

    fireEvent.click(screen.getByText("Log out"));
    await waitFor(() => {
      expect(clearSession).toHaveBeenCalledTimes(1);
    });
    expect(resetMode).toHaveBeenCalledTimes(1);

    modeHookMock.useModeSelection.mockReturnValue({
      mode: "single_player",
      selectMode,
      resetMode,
    });
    view.rerender(<EntryContainer />);
    expect(view.getByText("Blend:single_player:none:none")).toBeInTheDocument();

    modeHookMock.useModeSelection.mockReturnValue({
      mode: "multiplayer",
      selectMode,
      resetMode,
    });
    view.rerender(<EntryContainer />);
    expect(view.container).toHaveTextContent("Multiplayer Room");

    sessionHookMock.useSessionState.mockReturnValue({
      session: null,
      loadState: "ready",
      errorMessage: null,
      enterAsGuest,
      enterWithOAuth: vi.fn(),
      renameGuest,
      clearSession,
    });
    view.rerender(<EntryContainer />);
    fireEvent.click(screen.getByRole("button", { name: "Guest" }));
    fireEvent.click(screen.getByText("Continue as guest"));
    await waitFor(() => {
      expect(enterAsGuest).toHaveBeenCalledTimes(1);
    });
  });

  test("LobbyContainer joinRoom and leaveRoom success paths", async () => {
    const setErrorMessage = vi.fn();
    const joinRoom = vi.fn().mockResolvedValue(undefined);
    const leaveRoom = vi.fn().mockResolvedValue(undefined);

    lobbyHookMock.useRoomState.mockReturnValue({
      room: null,
      availableRooms: [],
      activeMatchId: null,
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId: vi.fn(),
      createRoom: vi.fn().mockResolvedValue(undefined),
      joinRoom,
      leaveRoom,
      deleteRoom: vi.fn(),
    });

    const session = {
      sessionId: "s1",
      sessionType: "guest" as const,
      status: "active" as const,
      lastActivityAt: "2026-04-01T00:00:00Z",
      player: { playerId: "p1", identityType: "guest" as const, displayName: "Host", profileAvatar: "" },
    };

    const view = render(<LobbyContainer session={session} currentPlayerId="p1" />);

    // successful joinRoom — covers line 42 normal-completion branch
    fireEvent.change(within(view.container).getByLabelText("Room ID"), { target: { value: "room-ok" } });
    fireEvent.click(within(view.container).getByText("Join room"));
    await waitFor(() => expect(joinRoom).toHaveBeenCalledWith("room-ok"));

    // rerender with a room so Leave room button is visible
    lobbyHookMock.useRoomState.mockReturnValue({
      room: {
        roomId: "room-ok",
        roomStatus: "open",
        joinPolicy: "open",
        waitingPolicy: "late_join_waiting_allowed",
        hostPlayerId: "p1",
        hostDisplayName: "Host",
        members: [],
      },
      availableRooms: [],
      activeMatchId: null,
      errorMessage: null,
      setErrorMessage,
      setActiveMatchId: vi.fn(),
      createRoom: vi.fn().mockResolvedValue(undefined),
      joinRoom,
      leaveRoom,
      deleteRoom: vi.fn(),
    });
    view.rerender(<LobbyContainer session={session} currentPlayerId="p1" />);

    // successful leaveRoom — covers line 50 normal-completion branch
    // use within(container) to avoid matching "Leave room" from prior tests still in DOM
    fireEvent.click(within(view.container).getByText("Leave room"));
    await waitFor(() => expect(leaveRoom).toHaveBeenCalled());
  });

  test("SocialPanelContainer realtime success without onStateChange covers optional-call branch", async () => {
    let onMessage: ((message: unknown) => void) | undefined;

    apiClientMock.getSocialState
      .mockResolvedValueOnce({ presetMessages: [], interactions: [], submissionSummaries: [], crowdFavorites: [] })
      .mockResolvedValueOnce({ presetMessages: [], interactions: [], submissionSummaries: [], crowdFavorites: [] });
    realtimeMock.subscribeToMatch.mockImplementation((_matchId: string, handler: (m: unknown) => void) => {
      onMessage = handler;
      return vi.fn();
    });

    // render WITHOUT onStateChange — line 61's onStateChange?.() takes the undefined branch
    render(<SocialPanelContainer matchId="match-no-cb" />);

    await waitFor(() => expect(apiClientMock.getSocialState).toHaveBeenCalledTimes(1));

    onMessage?.({ event: "social_interaction_update" });

    await waitFor(() => expect(apiClientMock.getSocialState).toHaveBeenCalledTimes(2));
  });

  test("SocialPanelContainer covers fallback toast labels and expired toast cleanup", async () => {
    vi.useFakeTimers();
    const nowSpy = vi.spyOn(Date, "now");
    let now = 10_000;
    nowSpy.mockImplementation(() => now);

    apiClientMock.getSocialState.mockResolvedValueOnce({
      presetMessages: [],
      interactions: [
        {
          socialInteractionId: "i-1",
          interactionType: "wave",
          displayName: "Casey",
          targetDisplayName: null,
          targetSubmissionId: null,
          presetMessage: null,
          createdAt: "2026-04-01T00:00:00Z",
        },
      ],
      submissionSummaries: [],
      crowdFavorites: [],
    });
    realtimeMock.subscribeToMatch.mockReturnValue(vi.fn());

    const view = render(<SocialPanelContainer matchId="match-toast" />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(view.getByText("Casey — wave")).toBeInTheDocument();

    now = 20_000;
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(view.queryByText("Casey — wave")).not.toBeInTheDocument();
  });
});
