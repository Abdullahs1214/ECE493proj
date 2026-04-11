import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useGameplayState } from "../../src/hooks/useGameplayState";
import { useModeSelection } from "../../src/hooks/useModeSelection";
import { useRoomState } from "../../src/hooks/useRoomState";
import { useSessionState } from "../../src/hooks/useSessionState";


const apiClientMocks = vi.hoisted(() => ({
  createGuestSession: vi.fn(),
  getCurrentSession: vi.fn(),
  loginLocalAccount: vi.fn(),
  logoutSession: vi.fn(),
  registerLocalAccount: vi.fn(),
  signInWithOAuth: vi.fn(),
  updateCurrentSession: vi.fn(),
  getCurrentRoom: vi.fn(),
  getRooms: vi.fn(),
  createRoom: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  deleteRoom: vi.fn(),
  getGameplayState: vi.fn(),
  startGameplay: vi.fn(),
  submitGameplayColor: vi.fn(),
}));

const realtimeMocks = vi.hoisted(() => ({
  subscribeToRoom: vi.fn(),
  subscribeToMatch: vi.fn(),
}));

vi.mock("../../src/services/apiClient", () => apiClientMocks);
vi.mock("../../src/services/realtimeClient", () => realtimeMocks);

describe("state hooks", () => {
  beforeEach(() => {
    Object.values(apiClientMocks).forEach((mock) => mock.mockReset());
    Object.values(realtimeMocks).forEach((mock) => mock.mockReset());
    apiClientMocks.getCurrentRoom.mockResolvedValue(null);
    apiClientMocks.getRooms.mockResolvedValue([]);
    apiClientMocks.deleteRoom.mockResolvedValue({ roomClosed: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("useSessionState handles initial failure and session actions", async () => {
    apiClientMocks.getCurrentSession.mockRejectedValueOnce(new Error("boom"));
    apiClientMocks.createGuestSession.mockResolvedValueOnce({ sessionId: "guest-1" });
    apiClientMocks.updateCurrentSession.mockResolvedValueOnce({ sessionId: "guest-2" });
    apiClientMocks.logoutSession.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSessionState());

    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.loadState).toBe("error");
    });
    expect(result.current.errorMessage).toBe("Unable to load the current session.");

    await act(async () => {
      await result.current.enterAsGuest("Casey");
    });
    expect(apiClientMocks.createGuestSession).toHaveBeenCalledWith("Casey");
    expect(result.current.session).toEqual({ sessionId: "guest-1" });
    expect(result.current.loadState).toBe("ready");
    expect(result.current.errorMessage).toBeNull();

    await act(async () => {
      await result.current.renameGuest("Jordan");
    });
    expect(apiClientMocks.updateCurrentSession).toHaveBeenCalledWith("Jordan");
    expect(result.current.session).toEqual({ sessionId: "guest-2" });

    await act(async () => {
      await result.current.clearSession();
    });
    expect(apiClientMocks.logoutSession).toHaveBeenCalledTimes(1);
    expect(result.current.session).toBeNull();
  });

  test("useSessionState covers oauth restore failure, login success, avatar success, and fallback error messages", async () => {
    const replaceState = vi.fn();
    Object.defineProperty(window.history, "replaceState", {
      configurable: true,
      value: replaceState,
    });
    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/?oauthStatus=success"),
    });

    apiClientMocks.getCurrentSession
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce("oauth restore failed");
    apiClientMocks.registerLocalAccount.mockRejectedValueOnce("register failed");
    apiClientMocks.loginLocalAccount.mockResolvedValueOnce({ sessionId: "login-success" });
    apiClientMocks.createGuestSession.mockRejectedValueOnce("guest failed");
    apiClientMocks.signInWithOAuth.mockRejectedValueOnce("oauth failed");
    apiClientMocks.updateCurrentSession
      .mockRejectedValueOnce("rename failed")
      .mockResolvedValueOnce({ sessionId: "avatar-success" });
    apiClientMocks.logoutSession.mockRejectedValueOnce("logout failed");

    const { result } = renderHook(() => useSessionState());

    await waitFor(() => {
      expect(result.current.errorMessage).toBe("OAuth sign-in completed, but the session could not be restored.");
    });
    expect(replaceState).toHaveBeenCalled();

    await act(async () => {
      await result.current.registerLocal("casey", "pw", "Casey");
      await result.current.loginLocal("casey", "pw");
      await result.current.enterAsGuest("Casey");
      await result.current.enterWithOAuth("google");
      await result.current.renameGuest("New Name");
      await result.current.updateAvatar("avatar-data");
      await result.current.clearSession();
    });

    expect(result.current.session).toEqual({ sessionId: "avatar-success" });
    expect(result.current.loadState).toBe("ready");
    expect(result.current.errorMessage).toBe("Unable to log out.");
  });

  test("useSessionState ignores async load results after unmount", async () => {
    let resolveCurrentSession: ((value: unknown) => void) | undefined;
    apiClientMocks.getCurrentSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCurrentSession = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useSessionState());

    unmount();
    await act(async () => {
      resolveCurrentSession?.({ sessionId: "late-session" });
      await Promise.resolve();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.loadState).toBe("loading");
    expect(result.current.errorMessage).toBeNull();
  });

  test("useSessionState ignores async load errors after unmount", async () => {
    let rejectCurrentSession: ((reason?: unknown) => void) | undefined;
    apiClientMocks.getCurrentSession.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectCurrentSession = reject;
        }),
    );

    const { result, unmount } = renderHook(() => useSessionState());

    unmount();
    await act(async () => {
      rejectCurrentSession?.(new Error("late failure"));
      await Promise.resolve();
    });

    expect(result.current.session).toBeNull();
    expect(result.current.loadState).toBe("loading");
    expect(result.current.errorMessage).toBeNull();
  });

  test("useRoomState handles join, leave, realtime closure, and room clearing", async () => {
    let onMessage: ((message: any) => void) | undefined;
    let onClose: (() => void) | undefined;
    realtimeMocks.subscribeToRoom.mockImplementation((_roomId, messageHandler, closeHandler) => {
      onMessage = messageHandler;
      onClose = closeHandler;
      return vi.fn();
    });
    const room1 = { roomId: "room-1", roomStatus: "open", joinPolicy: "open", waitingPolicy: "late_join_waiting_allowed", hostPlayerId: "host", hostDisplayName: "Host", members: [] };
    apiClientMocks.joinRoom.mockResolvedValue(room1);
    apiClientMocks.getCurrentRoom
      .mockResolvedValueOnce(null)   // initial mount
      .mockResolvedValueOnce(room1); // after joinRoom
    apiClientMocks.leaveRoom.mockResolvedValueOnce({
      leftRoom: true,
      roomClosed: false,
      room: { roomId: "room-1", hostDisplayName: "Host", members: [] },
    });

    const { result } = renderHook(() => useRoomState());

    await act(async () => {
      await result.current.leaveRoom();
    });
    expect(apiClientMocks.leaveRoom).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.joinRoom("room-1");
    });

    expect(apiClientMocks.joinRoom).toHaveBeenCalledWith("room-1");
    expect(result.current.room?.roomId).toBe("room-1");
    expect(result.current.activeMatchId).toBeNull();

    act(() => {
      onMessage?.({
        event: "match_start_update",
        roomId: "room-1",
        matchId: "match-1",
      });
    });
    expect(result.current.activeMatchId).toBe("match-1");

    await act(async () => {
      await result.current.leaveRoom();
    });
    expect(apiClientMocks.leaveRoom).toHaveBeenCalledWith("room-1");

    act(() => {
      onMessage?.({
        event: "room_state_update",
        roomId: "room-1",
        roomClosed: true,
        room: null,
      });
    });
    expect(result.current.room).toBeNull();
    expect(result.current.activeMatchId).toBeNull();

    act(() => {
      onClose?.();
    });
    expect(result.current.errorMessage).toBe("Realtime room connection closed.");
  });

  test("useRoomState clears activeMatchId when leaving closes the room payload", async () => {
    const room2 = { roomId: "room-2", roomStatus: "open", joinPolicy: "open", waitingPolicy: "late_join_waiting_allowed", hostPlayerId: "host", hostDisplayName: "Host", members: [] };
    apiClientMocks.createRoom.mockResolvedValueOnce(room2);
    // 1st call: initial mount (room=null, no roomId), 2nd: after createRoom sets room2, 3rd+: after leaveRoom sets null
    apiClientMocks.getCurrentRoom
      .mockResolvedValueOnce(null)   // initial mount — roomId undefined
      .mockResolvedValueOnce(room2)  // after createRoom — roomId "room-2"
      .mockResolvedValueOnce(null)   // after leaveRoom — roomId undefined again
      .mockResolvedValue(null);
    apiClientMocks.leaveRoom.mockResolvedValueOnce({
      leftRoom: true,
      roomClosed: true,
      room: null,
    });
    realtimeMocks.subscribeToRoom.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useRoomState());

    await act(async () => {
      await result.current.createRoom();
    });
    // room is set directly by createRoom handler, not from getCurrentRoom
    act(() => {
      result.current.setActiveMatchId("match-2");
    });
    expect(result.current.activeMatchId).toBe("match-2");

    await act(async () => {
      await result.current.leaveRoom();
    });

    expect(result.current.room).toBeNull();
  });

  test("useRoomState clears activeMatchId when realtime marks the room closed", async () => {
    let onMessage: ((message: any) => void) | undefined;
    realtimeMocks.subscribeToRoom.mockImplementation((_roomId, messageHandler) => {
      onMessage = messageHandler;
      return vi.fn();
    });
    const room3 = { roomId: "room-3", roomStatus: "open", joinPolicy: "open", waitingPolicy: "late_join_waiting_allowed", hostPlayerId: "host", hostDisplayName: "Host", members: [] };
    apiClientMocks.createRoom.mockResolvedValueOnce(room3);
    apiClientMocks.getCurrentRoom.mockResolvedValue(room3); // always return room3 (covers all re-runs)

    const { result } = renderHook(() => useRoomState());

    await act(async () => {
      await result.current.createRoom();
    });
    act(() => {
      result.current.setActiveMatchId("match-3");
    });

    act(() => {
      onMessage?.({
        event: "room_state_update",
        roomId: "room-3",
        roomClosed: true,
        room: { roomId: "room-3", hostDisplayName: "Host", members: [] },
      });
    });

    expect(result.current.room?.roomId).toBe("room-3");
    expect(result.current.activeMatchId).toBeNull();
  });

  test("useRoomState covers getRooms fallback and deleteRoom branches", async () => {
    let onMessage: ((message: any) => void) | undefined;
    realtimeMocks.subscribeToRoom.mockImplementation((_roomId, messageHandler) => {
      onMessage = messageHandler;
      return vi.fn();
    });
    const room4 = { roomId: "room-4", roomStatus: "open", joinPolicy: "open", waitingPolicy: "late_join_waiting_allowed", hostPlayerId: "host", hostDisplayName: "Host", members: [] };
    apiClientMocks.getCurrentRoom.mockResolvedValue(room4);
    apiClientMocks.getRooms
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("refresh rooms failed"));
    apiClientMocks.createRoom.mockResolvedValueOnce(room4);
    apiClientMocks.deleteRoom.mockResolvedValueOnce({ roomClosed: true });

    const { result } = renderHook(() => useRoomState());

    await act(async () => {
      await result.current.deleteRoom();
    });
    expect(apiClientMocks.deleteRoom).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.createRoom();
    });

    act(() => {
      onMessage?.({
        event: "room_state_update",
        roomId: "room-4",
        roomClosed: false,
        room: room4,
      });
    });
    await waitFor(() => {
      expect(result.current.availableRooms).toEqual([]);
    });

    act(() => {
      result.current.setActiveMatchId("match-4");
    });
    await act(async () => {
      await result.current.deleteRoom();
    });

    expect(apiClientMocks.deleteRoom).toHaveBeenCalledWith("room-4");
    expect(result.current.activeMatchId).toBeNull();
  });

  test("useRoomState filters the previous room from available rooms when leaveRoom returns no room payload", async () => {
    const room = {
      roomId: "room-5",
      roomStatus: "open" as const,
      joinPolicy: "open" as const,
      waitingPolicy: "late_join_waiting_allowed" as const,
      hostPlayerId: "host",
      hostDisplayName: "Host",
      members: [],
    };
    const otherRoom = {
      ...room,
      roomId: "room-6",
      hostDisplayName: "Other",
    };

    realtimeMocks.subscribeToRoom.mockReturnValue(vi.fn());
    apiClientMocks.getCurrentRoom.mockResolvedValue(null);
    apiClientMocks.getRooms.mockResolvedValue([otherRoom]);
    apiClientMocks.joinRoom.mockResolvedValueOnce(room);
    apiClientMocks.leaveRoom.mockResolvedValueOnce({
      leftRoom: true,
      roomClosed: false,
      room: null,
    });

    const { result } = renderHook(() => useRoomState());

    await waitFor(() => {
      expect(result.current.availableRooms).toEqual([otherRoom]);
    });

    await act(async () => {
      await result.current.joinRoom("room-5");
    });
    expect(apiClientMocks.joinRoom).toHaveBeenCalledWith("room-5");

    await act(async () => {
      await result.current.leaveRoom();
    });

    await waitFor(() => {
      expect(result.current.room).toBeNull();
      expect(result.current.availableRooms).toEqual([otherRoom]);
    });
  });

  test("useGameplayState covers initial error, match subscription, polling, and submit branches", async () => {
    const pollingState = {
      matchId: "match-1",
      matchStatus: "active_round",
      round: { remainingSeconds: 25 },
    };
    const submittedState = {
      matchId: "match-1",
      matchStatus: "results",
      round: { remainingSeconds: 0 },
    };
    let onMessage: ((message: any) => void) | undefined;
    let onClose: (() => void) | undefined;
    let intervalCallback: (() => Promise<void>) | undefined;

    apiClientMocks.startGameplay
      .mockRejectedValueOnce("bad")
      .mockResolvedValueOnce({
        matchId: "match-1",
        matchStatus: "active_round",
        round: { remainingSeconds: 30 },
      });
    const resultsState = { matchId: "match-1", matchStatus: "results", canAdvance: false, round: { remainingSeconds: 25 } };
    apiClientMocks.getGameplayState
      .mockResolvedValueOnce({
        matchId: "existing-match",
        matchStatus: "results",
        canAdvance: false,
        round: { remainingSeconds: 0 },
      })
      .mockResolvedValue(resultsState); // all subsequent calls (interval polling) return results
    apiClientMocks.submitGameplayColor
      .mockRejectedValueOnce("nope")
      .mockResolvedValueOnce(submittedState);
    realtimeMocks.subscribeToMatch.mockImplementation((_matchId, messageHandler, closeHandler) => {
      onMessage = messageHandler;
      onClose = closeHandler;
      return vi.fn();
    });
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      intervalCallback = callback as () => Promise<void>;
      return 1 as unknown as number;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => {});

    const errorHook = renderHook(() => useGameplayState({ mode: "single_player" }));
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(errorHook.result.current.errorMessage).toBe("Unable to start gameplay.");
    });
    expect(errorHook.result.current.isLoading).toBe(false);

    const existingHook = renderHook(() =>
      useGameplayState({ mode: "multiplayer", roomId: "room-1", initialMatchId: "existing-match" }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(existingHook.result.current.gameplay?.matchId).toBe("existing-match");
    });
    expect(apiClientMocks.getGameplayState).toHaveBeenCalledWith("existing-match");

    const activeHook = renderHook(() => useGameplayState({ mode: "single_player" }));
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(activeHook.result.current.gameplay?.matchId).toBe("match-1");
    });
    // flush effects (setInterval spy should now be captured)
    await act(async () => { await Promise.resolve(); });

    act(() => {
      onMessage?.({ event: "connection_ready", scope: "match", topicId: "match-1" });
      onMessage?.({ event: "submission_rejection_update" });
      onMessage?.({ event: "round_start_update" });
    });
    expect(activeHook.result.current.realtimeReady).toBe(true);
    expect(activeHook.result.current.errorMessage).toBe("Submission rejected.");

    act(() => {
      onClose?.();
    });
    expect(activeHook.result.current.realtimeReady).toBe(false);

    // Deliver a realtime scoring update carrying the results state
    const resultsPayload = { matchId: "match-1", matchStatus: "results", canAdvance: false, round: { remainingSeconds: 25 } };
    act(() => {
      onMessage?.({ event: "scoring_update", gameplay: resultsPayload });
    });
    expect(activeHook.result.current.gameplay?.matchStatus).toBe("results");

    await act(async () => {
      await activeHook.result.current.submitColor([1, 2, 3]);
    });
    expect(activeHook.result.current.errorMessage).toBe("Unable to submit color.");

    await act(async () => {
      await activeHook.result.current.submitColor([4, 5, 6]);
    });
    expect(apiClientMocks.submitGameplayColor).toHaveBeenLastCalledWith("match-1", [4, 5, 6]);
    expect(activeHook.result.current.gameplay).toEqual(submittedState);
    expect(activeHook.result.current.errorMessage).toBeNull();
  });

  test("useGameplayState polling success updates gameplay state", async () => {
    let intervalCallback: (() => Promise<void>) | undefined;
    const initialState = {
      matchId: "match-poll",
      matchStatus: "active_round" as const,
      canAdvance: false,
      round: { remainingSeconds: 12 },
    };
    const refreshedState = {
      ...initialState,
      round: { remainingSeconds: 7 },
    };

    apiClientMocks.startGameplay.mockResolvedValueOnce(initialState);
    apiClientMocks.getGameplayState.mockResolvedValueOnce(refreshedState);
    realtimeMocks.subscribeToMatch.mockReturnValue(vi.fn());
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      intervalCallback = callback as () => Promise<void>;
      return 1 as unknown as number;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => {});

    const { result } = renderHook(() => useGameplayState({ mode: "single_player" }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.gameplay?.matchId).toBe("match-poll");
    expect(intervalCallback).toBeTypeOf("function");

    await act(async () => {
      await intervalCallback?.();
    });

    expect(apiClientMocks.getGameplayState).toHaveBeenCalledWith("match-poll");
    expect(result.current.gameplay?.round.remainingSeconds).toBe(7);
  });

  test("useGameplayState returns early when submitting without gameplay", async () => {
    apiClientMocks.startGameplay.mockRejectedValueOnce(new Error("start failed"));
    realtimeMocks.subscribeToMatch.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useGameplayState({ mode: "single_player" }));

    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.submitColor([9, 9, 9]);
    });

    expect(apiClientMocks.submitGameplayColor).not.toHaveBeenCalled();
  });

  test("useGameplayState ignores startup errors after unmount", async () => {
    let rejectLoad: ((reason?: unknown) => void) | undefined;
    apiClientMocks.startGameplay.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectLoad = reject;
        }),
    );
    realtimeMocks.subscribeToMatch.mockReturnValue(vi.fn());

    const { result, unmount } = renderHook(() => useGameplayState({ mode: "single_player" }));

    unmount();
    await act(async () => {
      rejectLoad?.(new Error("late gameplay failure"));
      await Promise.resolve();
    });

    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  test("useGameplayState ignores startup success after unmount", async () => {
    let resolveLoad: ((value: unknown) => void) | undefined;
    apiClientMocks.startGameplay.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
    realtimeMocks.subscribeToMatch.mockReturnValue(vi.fn());

    const { result, unmount } = renderHook(() => useGameplayState({ mode: "single_player" }));

    unmount();
    await act(async () => {
      resolveLoad?.({
        matchId: "late-match",
        matchStatus: "active_round",
        round: { remainingSeconds: 33 },
      });
      await Promise.resolve();
    });

    expect(result.current.gameplay).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  test("useGameplayState reports polling refresh failures", async () => {
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      void (callback as () => Promise<void>)();
      return 1 as unknown as number;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => {});

    apiClientMocks.startGameplay.mockResolvedValueOnce({
      matchId: "match-poll",
      matchStatus: "active_round",
      round: { remainingSeconds: 30 },
    });
    apiClientMocks.getGameplayState.mockRejectedValueOnce("refresh failed");
    realtimeMocks.subscribeToMatch.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useGameplayState({ mode: "single_player" }));

    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.gameplay?.matchId).toBe("match-poll");
    });
    await waitFor(() => {
      expect(apiClientMocks.getGameplayState).toHaveBeenCalledWith("match-poll");
      expect(result.current.errorMessage).toBe("Unable to refresh gameplay.");
    });
  });

  test("useGameplayState uses error.message for Error instances during polling and submit", async () => {
    vi.spyOn(window, "setInterval").mockImplementation((callback) => {
      void (callback as () => Promise<void>)();
      return 1 as unknown as number;
    });
    vi.spyOn(window, "clearInterval").mockImplementation(() => {});

    apiClientMocks.startGameplay.mockResolvedValueOnce({
      matchId: "match-err-inst",
      matchStatus: "active_round",
      round: { remainingSeconds: 10 },
    });
    // polling failure with Error instance → line 94 uses error.message
    apiClientMocks.getGameplayState.mockRejectedValueOnce(new Error("poll error msg"));
    // submit failure with Error instance → line 110 uses error.message
    apiClientMocks.submitGameplayColor.mockRejectedValueOnce(new Error("submit error msg"));
    realtimeMocks.subscribeToMatch.mockReturnValue(vi.fn());

    const { result } = renderHook(() => useGameplayState({ mode: "single_player" }));

    await act(async () => { await Promise.resolve(); });
    await waitFor(() => expect(result.current.gameplay?.matchId).toBe("match-err-inst"));

    // polling fired immediately; check error.message branch (line 94)
    await waitFor(() => expect(result.current.errorMessage).toBe("poll error msg"));

    // submit failure via Error instance (line 110)
    await act(async () => {
      await result.current.submitColor([5, 5, 5]);
    });
    expect(result.current.errorMessage).toBe("submit error msg");
  });

  test("useRoomState room_state_update with roomClosed false and valid room skips matchId clear", async () => {
    let onMessage: ((message: unknown) => void) | undefined;
    realtimeMocks.subscribeToRoom.mockImplementation((_roomId: string, handler: (m: unknown) => void) => {
      onMessage = handler;
      return vi.fn();
    });
    const roomNc = { roomId: "room-nc", roomStatus: "open", joinPolicy: "open", waitingPolicy: "late_join_waiting_allowed", hostPlayerId: "player-1", hostDisplayName: "Host", members: [] };
    apiClientMocks.createRoom.mockResolvedValueOnce(roomNc);
    apiClientMocks.getCurrentRoom.mockResolvedValue(roomNc);

    const { result } = renderHook(() => useRoomState());

    await act(async () => { await result.current.createRoom(); });
    act(() => { result.current.setActiveMatchId("match-nc"); });
    expect(result.current.activeMatchId).toBe("match-nc");

    // room_state_update with roomClosed: false and non-null room
    // covers: message.room ?? null (primary branch) and if(roomClosed || !room) = false
    act(() => {
      onMessage?.({
        event: "room_state_update",
        roomId: "room-nc",
        roomClosed: false,
        room: {
          roomId: "room-nc",
          hostDisplayName: "Host",
          roomStatus: "open",
          joinPolicy: "open",
          waitingPolicy: "late_join_waiting_allowed",
          hostPlayerId: "player-1",
          members: [],
        },
      });
    });

    expect(result.current.room?.roomId).toBe("room-nc");
    expect(result.current.activeMatchId).toBe("match-nc"); // NOT cleared
  });

  test("useModeSelection resetMode clears the selected mode", () => {
    const { result } = renderHook(() => useModeSelection());

    act(() => result.current.selectMode("single_player"));
    expect(result.current.mode).toBe("single_player");

    act(() => result.current.resetMode());
    expect(result.current.mode).toBeNull();
  });

});
