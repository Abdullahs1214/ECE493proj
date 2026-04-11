import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import LobbyPanel from "../../src/components/LobbyPanel";
import SocialPanel from "../../src/components/SocialPanel";
import EntryContainer from "../../src/containers/EntryContainer";
import ResultsContainer from "../../src/containers/ResultsContainer";

const childProps = vi.hoisted(() => ({
  entry: null as any,
  blend: null as any,
  lobby: null as any,
}));

const entryContainerMocks = vi.hoisted(() => ({
  useSessionState: vi.fn(),
  useModeSelection: vi.fn(),
}));

const roomHookMocks = vi.hoisted(() => ({
  createRoom: vi.fn(),
  deleteRoom: vi.fn(),
  getCurrentRoom: vi.fn(),
  getRooms: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
}));

const subscribeRoomMock = vi.hoisted(() => ({
  subscribeToRoom: vi.fn(),
  subscribeToMatch: vi.fn(() => vi.fn()),
}));

vi.mock("../../src/components/EntryPanel", () => ({
  default: (props: any) => {
    childProps.entry = props;
    return <div>Mock Entry Panel</div>;
  },
}));

vi.mock("../../src/containers/HistoryContainer", () => ({
  default: ({ session }: any) => <div>History for {session.player.displayName}</div>,
}));

vi.mock("../../src/containers/BlendGameContainer", () => ({
  default: (props: any) => {
    childProps.blend = props;
    return <button onClick={() => props.onBackToMenu?.()}>Mock Blend Game</button>;
  },
}));

vi.mock("../../src/containers/LobbyContainer", () => ({
  default: (props: any) => {
    childProps.lobby = props;
    return <button onClick={() => props.onBackToMenu?.()}>Mock Lobby</button>;
  },
}));

vi.mock("../../src/hooks/useSessionState", () => ({
  useSessionState: entryContainerMocks.useSessionState,
}));

vi.mock("../../src/hooks/useModeSelection", () => ({
  useModeSelection: entryContainerMocks.useModeSelection,
}));

vi.mock("../../src/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ...roomHookMocks,
  };
});

vi.mock("../../src/services/realtimeClient", () => subscribeRoomMock);

describe("wrapper edge coverage", () => {
  beforeEach(() => {
    childProps.entry = null;
    childProps.blend = null;
    childProps.lobby = null;
    Object.values(entryContainerMocks).forEach((mock) => mock.mockReset());
    Object.values(roomHookMocks).forEach((mock) => mock.mockReset());
    Object.values(subscribeRoomMock).forEach((mock) => mock.mockReset());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("EntryContainer covers wrapper handlers and restart behavior", async () => {
    const session = {
      sessionId: "s1",
      sessionType: "authenticated",
      status: "active",
      lastActivityAt: "2026-04-01T00:00:00Z",
      player: { playerId: "p1", identityType: "authenticated", displayName: "Alex", profileAvatar: "" },
    } as const;
    const sessionApi = {
      session,
      loadState: "ready",
      errorMessage: null,
      registerLocal: vi.fn(),
      loginLocal: vi.fn(),
      enterAsGuest: vi.fn().mockResolvedValue(undefined),
      enterWithOAuth: vi.fn().mockResolvedValue(undefined),
      renameGuest: vi.fn().mockResolvedValue(undefined),
      updateAvatar: vi.fn().mockResolvedValue(undefined),
      clearSession: vi.fn().mockResolvedValue(undefined),
    };
    const modeApi = {
      mode: null,
      selectMode: vi.fn(),
      resetMode: vi.fn(),
    };
    entryContainerMocks.useSessionState.mockReturnValue(sessionApi);
    entryContainerMocks.useModeSelection.mockReturnValue(modeApi);

    render(<EntryContainer />);
    expect(screen.getByText("Mock Entry Panel")).toBeInTheDocument();
    expect(screen.getByText("History for Alex")).toBeInTheDocument();

    await act(async () => {
      await childProps.entry.onGuestEntry();
      await childProps.entry.onOAuthEntry("github");
      await childProps.entry.onRenameGuest();
      childProps.entry.onDraftDisplayNameChange("  ");
      await childProps.entry.onRenameGuest();
      childProps.entry.onDraftDisplayNameChange("Casey");
      await childProps.entry.onRenameGuest();
      childProps.entry.onDraftAvatarUrlChange("  avatar  ");
      await childProps.entry.onUpdateAvatar();
      await childProps.entry.onClearAvatar();
      await childProps.entry.onLogout();
      childProps.entry.onSelectMode("multiplayer");
    });

    expect(sessionApi.enterAsGuest).toHaveBeenCalled();
    expect(sessionApi.enterWithOAuth).toHaveBeenCalledWith("github");
    expect(sessionApi.updateAvatar).toHaveBeenCalledWith("");
    expect(sessionApi.clearSession).toHaveBeenCalled();
    expect(modeApi.resetMode).toHaveBeenCalled();
    expect(modeApi.selectMode).toHaveBeenCalledWith("multiplayer");

    act(() => {
      window.dispatchEvent(new CustomEvent("restart-game"));
    });
    expect(modeApi.selectMode).toHaveBeenCalledWith("single_player");

    entryContainerMocks.useModeSelection.mockReturnValue({ ...modeApi, mode: "single_player" });
    render(<EntryContainer />);
    fireEvent.click(screen.getAllByText("Mock Blend Game")[0]);
    expect(modeApi.resetMode).toHaveBeenCalled();

    entryContainerMocks.useModeSelection.mockReturnValue({ ...modeApi, mode: "multiplayer" });
    render(<EntryContainer />);
    fireEvent.click(screen.getAllByText("Mock Lobby")[0]);
    expect(modeApi.resetMode).toHaveBeenCalled();
  });

  test("LobbyPanel covers copy, member badges, and available room list", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const session = {
      sessionId: "session",
      sessionType: "guest",
      status: "active",
      lastActivityAt: "2026-04-01T00:00:00Z",
      player: { playerId: "p2", identityType: "guest", displayName: "Guest", profileAvatar: "" },
    } as const;

    const onJoinRoomById = vi.fn();
    render(
      <LobbyPanel
        session={session}
        room={{
          roomId: "room-1234",
          roomStatus: "open",
          joinPolicy: "open",
          waitingPolicy: "late_join_waiting_allowed",
          hostPlayerId: "host-1",
          hostDisplayName: "Host",
          members: [
            {
              roomMembershipId: "m1",
              membershipStatus: "active",
              joinedAt: "2026-04-01T00:00:00Z",
              player: { playerId: "host-1", identityType: "guest" as const, displayName: "Host" },
            },
            {
              roomMembershipId: "m2",
              membershipStatus: "waiting_for_next_game",
              joinedAt: "2026-04-01T00:00:00Z",
              player: { playerId: "p2", identityType: "guest" as const, displayName: "Guest" },
            },
            {
              roomMembershipId: "m3",
              membershipStatus: "disconnected",
              joinedAt: "2026-04-01T00:00:00Z",
              player: { playerId: "p3", identityType: "guest" as const, displayName: "Offline" },
            },
          ],
        }}
        availableRooms={[]}
        currentPlayerId="p2"
        roomIdInput=""
        errorMessage={null}
        onRoomIdInputChange={vi.fn()}
        onCreateRoom={vi.fn()}
        onJoinRoom={vi.fn()}
        onJoinRoomById={onJoinRoomById}
        onLeaveRoom={vi.fn()}
        onDeleteRoom={vi.fn()}
        onStartGameplay={vi.fn()}
        isStarting
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy full ID" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("room-1234");
    });
    expect(screen.getByText(/Guest — waiting/)).toBeInTheDocument();
    expect(screen.getByText(/Offline — disconnected/)).toBeInTheDocument();
    expect(screen.getByText(/Host:/)).toHaveTextContent("Host");
    expect(screen.queryByText("Delete room")).not.toBeInTheDocument();

    render(
      <LobbyPanel
        session={session}
        room={null}
        availableRooms={[
          {
            roomId: "room-a",
            roomStatus: "open",
            joinPolicy: "open",
            waitingPolicy: "late_join_waiting_allowed",
            hostPlayerId: "host-a",
            hostDisplayName: "Host A",
            members: [
              {
                roomMembershipId: "m1",
                membershipStatus: "active",
                joinedAt: "2026-04-01T00:00:00Z",
                player: { playerId: "host-a", identityType: "guest" as const, displayName: "Host A" },
              },
            ],
          },
        ]}
        currentPlayerId="p2"
        roomIdInput=""
        errorMessage={null}
        onRoomIdInputChange={vi.fn()}
        onCreateRoom={vi.fn()}
        onJoinRoom={vi.fn()}
        onJoinRoomById={onJoinRoomById}
        onLeaveRoom={vi.fn()}
        onDeleteRoom={vi.fn()}
        onStartGameplay={vi.fn()}
      />,
    );

    expect(screen.getByText("Active rooms")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Join" }));
    expect(onJoinRoomById).toHaveBeenCalledWith("room-a");
  });

  test("SocialPanel covers fallback labels and empty state", () => {
    const onPresetMessage = vi.fn();
    const onUpvote = vi.fn();
    const onHighlight = vi.fn();

    render(
      <SocialPanel
        social={{
          presetMessages: ["Nice blend!"],
          interactions: [
            { socialInteractionId: "i1", interactionType: "preset_message", displayName: "Alex", presetMessage: "Nice blend!" },
            { socialInteractionId: "i2", interactionType: "upvote", displayName: "Blair", targetDisplayName: null },
            { socialInteractionId: "i3", interactionType: "highlight", displayName: "Casey", targetDisplayName: null },
            { socialInteractionId: "i4", interactionType: "wave" as any, displayName: "Dana" },
          ],
          submissionSummaries: [],
          crowdFavorites: [{ playerId: "p1", displayName: "Alex", reactionCount: 1 }],
        }}
        toasts={[{ id: "t1", label: "toast", addedAt: 1 }]}
        currentPlayerId="p1"
        onPresetMessage={onPresetMessage}
        onUpvote={onUpvote}
        onHighlight={onHighlight}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nice blend!" }));
    expect(onPresetMessage).toHaveBeenCalledWith("Nice blend!");
    fireEvent.click(screen.getByRole("button", { name: "Show history (4)" }));
    expect(screen.getByText('Alex: "Nice blend!"')).toBeInTheDocument();
    expect(screen.getByText("Blair upvoted a submission")).toBeInTheDocument();
    expect(screen.getByText("Casey highlighted a submission")).toBeInTheDocument();
    expect(screen.getByText("Dana — wave")).toBeInTheDocument();
    expect(screen.getByText("No submissions to react to yet.")).toBeInTheDocument();

    render(
      <SocialPanel
        social={{
          presetMessages: [],
          interactions: [],
          submissionSummaries: [
            {
              submissionId: "s1",
              playerId: "p1",
              displayName: "Alex",
              upvoteCount: 1,
              highlightCount: 1,
              hasUpvoted: true,
              hasHighlighted: true,
            },
          ],
          crowdFavorites: [],
        }}
        toasts={[]}
        currentPlayerId="p1"
        onPresetMessage={onPresetMessage}
        onUpvote={onUpvote}
        onHighlight={onHighlight}
      />,
    );

    expect(screen.queryByRole("button", { name: "Upvoted" })).not.toBeInTheDocument();
  });

  test("ResultsContainer covers leaderboard fallback branch", () => {
    const onAdvance = vi.fn();
    render(
      <ResultsContainer
        matchId="match-noadvance"
        round={{
          roundId: "r1",
          roundNumber: 1,
          roundStatus: "results",
          targetColor: [0, 0, 0],
          baseColorSet: [[0, 0, 0]],
          timeLimit: 10,
          remainingSeconds: 0,
        }}
        results={[]}
        matchLeaderboard={[{ playerId: "p2", displayName: "Blair", rank: 2, totalScore: 10 }]}
        mode="multiplayer"
        currentRoundNumber={1}
        totalRounds={1}
        canAdvance
        isHost
        currentPlayerId="p2"
        onAdvance={onAdvance}
      />,
    );

    expect(screen.getByText("Match Results")).toBeInTheDocument();
    expect(onAdvance).not.toHaveBeenCalled();
  });
});
