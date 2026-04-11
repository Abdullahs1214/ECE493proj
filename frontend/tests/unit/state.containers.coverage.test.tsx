import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import BlendGameContainer from "../../src/containers/BlendGameContainer";
import ResultsContainer from "../../src/containers/ResultsContainer";
import { useSessionState } from "../../src/hooks/useSessionState";

const apiClientMocks = vi.hoisted(() => ({
  createGuestSession: vi.fn(),
  getCurrentSession: vi.fn(),
  loginLocalAccount: vi.fn(),
  logoutSession: vi.fn(),
  registerLocalAccount: vi.fn(),
  signInWithOAuth: vi.fn(),
  updateCurrentSession: vi.fn(),
  advanceRound: vi.fn(),
}));

const gameplayHookMocks = vi.hoisted(() => ({
  useGameplayState: vi.fn(),
}));

const socialContainerMocks = vi.hoisted(() => ({
  default: ({ matchId }: { matchId: string }) => <div>Social container {matchId}</div>,
}));

vi.mock("../../src/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ...apiClientMocks,
  };
});
vi.mock("../../src/hooks/useGameplayState", () => gameplayHookMocks);
vi.mock("../../src/containers/SocialPanelContainer", () => socialContainerMocks);

describe("state and container coverage", () => {
  beforeEach(() => {
    Object.values(apiClientMocks).forEach((mock) => mock.mockReset());
    gameplayHookMocks.useGameplayState.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("useSessionState covers oauth flows and auth helpers", async () => {
    const replaceState = vi.fn();
    Object.defineProperty(window.history, "replaceState", {
      configurable: true,
      value: replaceState,
    });

    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/?oauthStatus=success"),
    });

    apiClientMocks.getCurrentSession.mockResolvedValueOnce({ sessionId: "initial" }).mockResolvedValueOnce({ sessionId: "oauth-restored" });
    apiClientMocks.registerLocalAccount.mockResolvedValueOnce({ sessionId: "registered" });
    apiClientMocks.loginLocalAccount.mockRejectedValueOnce(new Error("bad login"));
    apiClientMocks.createGuestSession.mockRejectedValueOnce(new Error("guest failed"));
    apiClientMocks.signInWithOAuth.mockResolvedValueOnce({ sessionId: "oauth" });
    apiClientMocks.updateCurrentSession
      .mockResolvedValueOnce({ sessionId: "renamed" })
      .mockRejectedValueOnce(new Error("avatar failed"));
    apiClientMocks.logoutSession.mockRejectedValueOnce(new Error("logout failed"));

    const { result, rerender } = renderHook(() => useSessionState());

    await waitFor(() => {
      expect(result.current.session).toEqual({ sessionId: "oauth-restored" });
    });
    expect(result.current.loadState).toBe("ready");
    expect(replaceState).toHaveBeenCalled();

    await act(async () => {
      await result.current.registerLocal("casey", "pw", "Casey");
    });
    expect(result.current.session).toEqual({ sessionId: "registered" });

    await act(async () => {
      await result.current.loginLocal("casey", "bad");
    });
    expect(result.current.errorMessage).toBe("bad login");

    await act(async () => {
      await result.current.enterAsGuest("Casey");
    });
    expect(result.current.errorMessage).toBe("guest failed");
    expect(result.current.loadState).toBe("error");

    await act(async () => {
      await result.current.enterWithOAuth("google");
    });
    expect(apiClientMocks.signInWithOAuth).toHaveBeenCalledWith("google");

    await act(async () => {
      await result.current.renameGuest("New Name");
    });
    expect(apiClientMocks.updateCurrentSession).toHaveBeenCalledWith("New Name");

    await act(async () => {
      await result.current.updateAvatar("avatar-data");
    });
    expect(result.current.errorMessage).toBe("avatar failed");

    await act(async () => {
      await result.current.clearSession();
    });
    expect(result.current.errorMessage).toBe("logout failed");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/?oauthStatus=cancelled"),
    });
    apiClientMocks.getCurrentSession.mockResolvedValue(null);
    const cancelled = renderHook(() => useSessionState());
    await waitFor(() => {
      expect(cancelled.result.current.errorMessage).toBe("OAuth sign-in was cancelled or denied.");
    });
    cancelled.unmount();
    cleanup();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/?oauthStatus=failed"),
    });
    apiClientMocks.getCurrentSession.mockResolvedValue(null);
    const failed = renderHook(() => useSessionState());
    await waitFor(() => {
      expect(failed.result.current.errorMessage).toBe("OAuth sign-in failed.");
    });
    failed.unmount();
    cleanup();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: new URL("http://localhost/?oauthStatus=unknown"),
    });
    apiClientMocks.getCurrentSession.mockResolvedValue(null);
    const unknown = renderHook(() => useSessionState());
    await waitFor(() => {
      expect(unknown.result.current.errorMessage).toBeNull();
    });
  });

  test("BlendGameContainer covers auto-submit, waiting state, and reset", async () => {
    const submitColor = vi.fn().mockResolvedValue(undefined);
    gameplayHookMocks.useGameplayState.mockReturnValue({
      gameplay: {
        matchId: "match-1",
        mode: "multiplayer",
        matchStatus: "active_round",
        currentRoundNumber: 1,
        totalRounds: 3,
        canAdvance: true,
        matchLeaderboard: null,
        round: {
          roundId: "round-1",
          roundNumber: 1,
          roundStatus: "active_blending",
          targetColor: [255, 0, 0],
          baseColorSet: [[255, 0, 0], [0, 0, 255]],
          timeLimit: 60,
          remainingSeconds: 0,
        },
        submissions: [
          { playerId: "p1", displayName: "Alex", submissionStatus: "waiting" },
          { playerId: "p2", displayName: "Blair", submissionStatus: "submitted" },
        ],
        results: [],
      },
      setGameplay: vi.fn(),
      errorMessage: null,
      isLoading: false,
      submitColor,
    });

    render(<BlendGameContainer mode="multiplayer" currentPlayerId="p1" />);

    await waitFor(() => {
      expect(submitColor).toHaveBeenCalledWith([]);
    });
    expect(screen.getByText("Waiting for other players")).toBeInTheDocument();
    expect(screen.getByText("Alex — Waiting")).toBeInTheDocument();
    expect(screen.queryByText("Blend your colors to match the target as closely as possible.")).not.toBeInTheDocument();
  });

  test("ResultsContainer covers single-player and multiplayer result branches", async () => {
    apiClientMocks.advanceRound.mockResolvedValueOnce({ matchId: "next-match" });
    const onAdvance = vi.fn();
    const onBackToLobby = vi.fn();
    const onBackToMenu = vi.fn();
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    const round = {
      roundId: "round-1",
      roundNumber: 1,
      roundStatus: "results",
      targetColor: [255, 255, 0] as [number, number, number],
      baseColorSet: [[255, 0, 0], [0, 255, 0], [0, 0, 255]] as [number, number, number][],
      timeLimit: 60,
      remainingSeconds: 0,
    };
    const results = [
      {
        playerId: "p1",
        displayName: "Alex",
        rank: 1,
        score: 100,
        similarityPercentage: 99,
        colorDistance: 0.1,
        tieBreakBasis: "exact_unrounded_color_distance",
        blendedColor: [255, 255, 10] as [number, number, number],
      },
    ];

    const { rerender } = render(
      <ResultsContainer
        matchId="match-1"
        round={round}
        results={results}
        matchLeaderboard={null}
        mode="single_player"
        currentRoundNumber={1}
        totalRounds={3}
        canAdvance
        onAdvance={onAdvance}
        onBackToMenu={onBackToMenu}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next Round" }));
    await waitFor(() => {
      expect(onAdvance).toHaveBeenCalledWith({ matchId: "next-match" });
    });

    rerender(
      <ResultsContainer
        matchId="match-1"
        round={round}
        results={results}
        matchLeaderboard={[
          { playerId: "p1", displayName: "Alex", rank: 1, totalScore: 250 },
          { playerId: "p2", displayName: "Blair", rank: 1, totalScore: 250 },
        ]}
        mode="single_player"
        currentRoundNumber={3}
        totalRounds={3}
        canAdvance={false}
        onBackToMenu={onBackToMenu}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play another match" }));
    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalled();
    });

    rerender(
      <ResultsContainer
        matchId="match-2"
        round={round}
        results={results}
        matchLeaderboard={null}
        mode="multiplayer"
        currentRoundNumber={1}
        totalRounds={2}
        canAdvance
        isHost={false}
        currentPlayerId="p1"
        onBackToLobby={onBackToLobby}
        onBackToMenu={onBackToMenu}
      />,
    );

    expect(screen.getByText("Waiting for the host to start the next round...")).toBeInTheDocument();
    expect(screen.getByText("Social container match-2")).toBeInTheDocument();

    rerender(
      <ResultsContainer
        matchId="match-2"
        round={round}
        results={results}
        matchLeaderboard={null}
        mode="multiplayer"
        currentRoundNumber={2}
        totalRounds={2}
        canAdvance={false}
        isHost
        currentPlayerId="p1"
        onBackToLobby={onBackToLobby}
        onBackToMenu={onBackToMenu}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Back to Lobby" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to menu" }));
    expect(onBackToLobby).toHaveBeenCalled();
    expect(onBackToMenu).toHaveBeenCalled();
  });
});
