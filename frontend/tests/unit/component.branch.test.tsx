import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import App from "../../src/App";
import BlendControls from "../../src/components/BlendControls";
import EntryPanel from "../../src/components/EntryPanel";
import HistoryPanel from "../../src/components/HistoryPanel";
import LobbyPanel from "../../src/components/LobbyPanel";
import BlendGameContainer from "../../src/containers/BlendGameContainer";
import SocialPanelContainer from "../../src/containers/SocialPanelContainer";

const useGameplayStateMock = vi.hoisted(() => ({
  useGameplayState: vi.fn(),
}));

vi.mock("../../src/hooks/useGameplayState", () => useGameplayStateMock);

const subscribeMock = vi.fn();
vi.mock("../../src/services/realtimeClient", () => ({
  subscribeToMatch: vi.fn(() => subscribeMock),
}));

const apiClientMock = vi.hoisted(() => ({
  getSocialState: vi.fn(),
  submitSocialInteraction: vi.fn(),
}));

vi.mock("../../src/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getSocialState: apiClientMock.getSocialState,
    submitSocialInteraction: apiClientMock.submitSocialInteraction,
  };
});

describe("additional component coverage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useGameplayStateMock.useGameplayState.mockReset();
    apiClientMock.getSocialState.mockReset();
    apiClientMock.submitSocialInteraction.mockReset();
  });

  test("App renders the entry flow shell", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ error: "No active session." }),
      }),
    );

    render(<App />);

    await waitFor(() => expect(screen.getByText("Welcome")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Guest" }));
    expect(screen.getByText("Continue as guest")).toBeInTheDocument();
  });

  test("BlendControls calls handlers on weight change and submit", () => {
    const setColor = vi.fn();
    const submit = vi.fn();

    render(
      <BlendControls
        baseColorSet={[[255, 0, 0]]}
        mixWeights={[50]}
        blendedColor={[128, 0, 0]}
        onMixWeightsChange={setColor}
        onReset={vi.fn()}
        onSubmit={submit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Red" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit color" }));

    expect(setColor).toHaveBeenCalled();
    expect(submit).toHaveBeenCalled();
  });

  test("HistoryPanel renders both lists", () => {
    const baseEntry = {
      historyScope: "room_scoped" as const,
      roomId: "room-1",
      roundId: "round-1",
      scoreRecordId: "score-1",
      similarityPercentage: 85,
      targetColor: null,
      blendedColor: null,
      roundNumber: 1,
      matchMode: "single_player" as const,
    };
    render(
      <HistoryPanel
        roomScopedHistory={[
          { ...baseEntry, scoreHistoryEntryId: "room-1", displayName: "Host", score: 200, rank: 1 },
        ]}
        identityScopedHistory={[
          { ...baseEntry, scoreHistoryEntryId: "identity-1", displayName: "Guest", score: 150, rank: 2 },
        ]}
      />,
    );

    expect(screen.getByText(/200 pts/)).toBeInTheDocument();
  });

  test("LobbyPanel toggles room and form views with errors", () => {
    const callbacks = {
      onRoomIdInputChange: vi.fn(),
      onCreateRoom: vi.fn(),
      onJoinRoom: vi.fn(),
      onLeaveRoom: vi.fn(),
      onDeleteRoom: vi.fn(),
      onStartGameplay: vi.fn(),
    };

    const session = {
      sessionId: "session",
      sessionType: "guest",
      status: "active",
      lastActivityAt: "2026-04-01T00:00:00Z",
      player: { playerId: "p", identityType: "guest", displayName: "Host", profileAvatar: "" },
    } as const;

    render(
      <LobbyPanel
        session={session}
        room={null}
        availableRooms={[]}
        currentPlayerId="p"
        roomIdInput=""
        errorMessage="no room"
        {...callbacks}
      />,
    );

    expect(screen.getByText("no room")).toBeInTheDocument();
    expect(screen.getByLabelText("Room ID")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create room" }));
    expect(callbacks.onCreateRoom).toHaveBeenCalled();

    const roomView = render(
      <LobbyPanel
        session={session}
        room={{
          roomId: "room-1",
          roomStatus: "open",
          joinPolicy: "open",
          waitingPolicy: "late_join_waiting_allowed",
          hostPlayerId: "p",
          hostDisplayName: "Host",
          members: [
            {
              roomMembershipId: "m1",
              membershipStatus: "active",
              joinedAt: "2026-04-01T00:00:00Z",
              player: { playerId: "p", identityType: "guest" as const, displayName: "Host" },
            },
            {
              roomMembershipId: "m2",
              membershipStatus: "active",
              joinedAt: "2026-04-01T00:00:00Z",
              player: { playerId: "other", identityType: "guest" as const, displayName: "Guest" },
            },
          ],
        }}
        availableRooms={[]}
        currentPlayerId="p"
        roomIdInput=""
        errorMessage={null}
        onDeleteRoom={vi.fn()}
        {...callbacks}
      />,
    );

    expect(
      within(roomView.container).getByText(
        (_, element) => element?.tagName === "P" && (element.textContent?.includes("Status: open") ?? false),
      ),
    ).toBeInTheDocument();
    expect(within(roomView.container).getByText("Guest")).toBeInTheDocument();
    fireEvent.click(within(roomView.container).getByText("Leave room"));
    expect(callbacks.onLeaveRoom).toHaveBeenCalled();
  });

  test("BlendGameContainer renders loading and results states", () => {
    useGameplayStateMock.useGameplayState.mockReturnValue({
      gameplay: null,
      errorMessage: null,
      isLoading: true,
      realtimeReady: false,
      submitColor: vi.fn(),
    });

    render(<BlendGameContainer mode="single_player" />);
    expect(screen.getByText("Loading gameplay...")).toBeInTheDocument();

    apiClientMock.getSocialState.mockResolvedValue({
      presetMessages: [],
      interactions: [],
      submissionSummaries: [],
      crowdFavorites: [],
    });

    useGameplayStateMock.useGameplayState.mockReturnValue({
      gameplay: {
        matchId: "match",
        mode: "single_player",
        matchStatus: "results",
        currentRoundNumber: 1,
        totalRounds: 3,
        canAdvance: false,
        matchLeaderboard: null,
        round: {
          roundId: "round",
          roundNumber: 1,
          roundStatus: "results",
          targetColor: [0, 0, 0],
          baseColorSet: [],
          timeLimit: 30,
          remainingSeconds: 0,
        },
        submissions: [],
        results: [],
      },
      errorMessage: null,
      isLoading: false,
      realtimeReady: true,
      submitColor: vi.fn(),
    });

    render(<BlendGameContainer mode="single_player" />);
    expect(screen.getByText(/Match complete!/)).toBeInTheDocument();

    // errorMessage set + no gameplay → shows errorMessage (line 33-34, primary branch of ??)
    useGameplayStateMock.useGameplayState.mockReturnValue({
      gameplay: null,
      errorMessage: "Failed to load.",
      isLoading: false,
      realtimeReady: false,
      submitColor: vi.fn(),
    });
    render(<BlendGameContainer mode="single_player" />);
    expect(screen.getByText("Failed to load.")).toBeInTheDocument();

    // errorMessage null + no gameplay → shows "Gameplay unavailable." (fallback branch of ??)
    useGameplayStateMock.useGameplayState.mockReturnValue({
      gameplay: null,
      errorMessage: null,
      isLoading: false,
      realtimeReady: false,
      submitColor: vi.fn(),
    });
    render(<BlendGameContainer mode="single_player" />);
    expect(screen.getByText("Gameplay unavailable.")).toBeInTheDocument();
  });

  test("SocialPanelContainer shows error when initial load fails", async () => {
    apiClientMock.getSocialState.mockRejectedValue("boom");
    apiClientMock.submitSocialInteraction.mockResolvedValue({
      presetMessages: [],
      interactions: [],
      submissionSummaries: [],
      crowdFavorites: [],
    });

    render(<SocialPanelContainer matchId="match-err" />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load social state.")).toBeInTheDocument();
    });
  });

  test("EntryPanel Single Player button invokes onSelectMode with single_player", () => {
    const onSelectMode = vi.fn();
    const session = {
      sessionId: "s1",
      sessionType: "guest" as const,
      status: "active" as const,
      lastActivityAt: "2026-04-01T00:00:00Z",
      player: { playerId: "p1", identityType: "guest" as const, displayName: "Host", profileAvatar: "" },
    };
    render(
      <EntryPanel
        session={session}
        loadState="ready"
        errorMessage={null}
        selectedMode={null}
        draftDisplayName=""
        draftAvatarUrl=""
        onDraftDisplayNameChange={vi.fn()}
        onDraftAvatarUrlChange={vi.fn()}
        onGuestEntry={vi.fn()}
        onOAuthEntry={vi.fn()}
        onRegister={vi.fn()}
        onLogin={vi.fn()}
        onRenameGuest={vi.fn()}
        onUpdateAvatar={vi.fn()}
        onClearAvatar={vi.fn()}
        onLogout={vi.fn()}
        onSelectMode={onSelectMode}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Single Player" }));
    expect(onSelectMode).toHaveBeenCalledWith("single_player");
  });
});
