import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  test("App reflects backend health failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Backend status: error")).toBeInTheDocument();
    });
  });

  test("BlendControls calls handlers on slider move and submit", () => {
    const color = [0, 0, 0];
    const setColor = vi.fn();
    const submit = vi.fn();

    render(
      <BlendControls
        blendedColor={color}
        onBlendedColorChange={setColor}
        onSubmit={submit}
      />,
    );

    fireEvent.change(screen.getAllByRole("slider")[0], { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit color" }));

    expect(setColor).toHaveBeenCalled();
    expect(submit).toHaveBeenCalled();
  });

  test("HistoryPanel renders both lists", () => {
    render(
      <HistoryPanel
        roomScopedHistory={[
          { scoreHistoryEntryId: "room-1", displayName: "Host", score: 200, rank: 1 },
        ]}
        identityScopedHistory={[
          { scoreHistoryEntryId: "identity-1", displayName: "Guest", score: 150, rank: 2 },
        ]}
      />,
    );

    expect(screen.getByText("Host - 200 points - rank 1")).toBeInTheDocument();
    expect(screen.getByText("Guest - 150 points - rank 2")).toBeInTheDocument();
  });

  test("LobbyPanel toggles room and form views with errors", () => {
    const callbacks = {
      onRoomIdInputChange: vi.fn(),
      onCreateRoom: vi.fn(),
      onJoinRoom: vi.fn(),
      onLeaveRoom: vi.fn(),
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
        roomIdInput=""
        errorMessage="no room"
        {...callbacks}
      />,
    );

    expect(screen.getByText("no room")).toBeInTheDocument();
    expect(screen.getByLabelText("Room ID")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Create room" }));
    expect(callbacks.onCreateRoom).toHaveBeenCalled();

    render(
      <LobbyPanel
        session={session}
        room={{
          roomId: "room-1",
          roomStatus: "open",
          hostPlayerId: "p",
          hostDisplayName: "Host",
          members: [
            { roomMembershipId: "m1", player: { playerId: "p", identityType: "guest" as const, displayName: "Host" } },
            { roomMembershipId: "m2", player: { playerId: "other", identityType: "guest" as const, displayName: "Guest" } },
          ],
        }}
        roomIdInput=""
        errorMessage={null}
        {...callbacks}
      />,
    );

    expect(screen.getByText("Room status: open")).toBeInTheDocument();
    expect(screen.getByText("Guest")).toBeInTheDocument(); // non-host member (no "(Host)" badge)
    fireEvent.click(screen.getByText("Leave room"));
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
      crowdFavorite: null,
    });

    useGameplayStateMock.useGameplayState.mockReturnValue({
      gameplay: {
        matchId: "match",
        mode: "single_player",
        matchStatus: "results",
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
    expect(screen.getByText("Score History")).toBeInTheDocument();

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
      crowdFavorite: null,
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
        onDraftDisplayNameChange={vi.fn()}
        onGuestEntry={vi.fn()}
        onRenameGuest={vi.fn()}
        onLogout={vi.fn()}
        onSelectMode={onSelectMode}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Single Player" }));
    expect(onSelectMode).toHaveBeenCalledWith("single_player");
  });
});
