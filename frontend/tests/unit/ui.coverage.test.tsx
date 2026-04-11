import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import BlendSimulator from "../../src/components/BlendSimulator";
import EntryPanel from "../../src/components/EntryPanel";
import HistoryPanel from "../../src/components/HistoryPanel";
import ResultsPanel from "../../src/components/ResultsPanel";
import TimerDisplay from "../../src/components/TimerDisplay";
import { useAmbientMusic } from "../../src/hooks/useAmbientMusic";
import { blendColors, colorName, computeOptimalWeights, FIXED_BASE_COLORS, textColorFor } from "../../src/utils/colorUtils";

describe("ui coverage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("covers color utilities", () => {
    expect(colorName([255, 0, 0])).toBe("Red");
    expect(colorName([12, 34, 56])).toBe("rgb(12, 34, 56)");
    expect(textColorFor([255, 255, 255])).toBe("#12212c");
    expect(textColorFor([0, 0, 0])).toBe("#f8fbfc");
    const weights = computeOptimalWeights(FIXED_BASE_COLORS, [255, 128, 0]);
    expect(weights).toHaveLength(FIXED_BASE_COLORS.length);
    expect(blendColors(FIXED_BASE_COLORS, weights.map((weight) => Math.round(weight * 1000)))).toEqual([255, 128, 0]);
    expect(blendColors(FIXED_BASE_COLORS, [0, 0, 0, 0, 0, 0, 0, 0])).toEqual([0, 0, 0]);
    expect(blendColors(FIXED_BASE_COLORS, [0, 0, 100, 0, 100, 0, 0, 0])).toEqual([128, 0, 128]);
    expect(blendColors([[255, 0, 0], [0, 255, 0]], [100])).toEqual([255, 0, 0]);
  });

  test("BlendSimulator renders and updates weights", () => {
    render(<BlendSimulator targetColor={[255, 255, 0]} initialWeights={[0, 0, 0.5, 0, 0, 0, 0, 0.5]} />);

    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(screen.getByText("Your mix")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Red" }));
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove Red" }));
    fireEvent.change(screen.getByLabelText("Red weight"), { target: { value: "200" } });
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load optimal" }));
    expect(screen.getByLabelText("Yellow weight")).toHaveValue(100);
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByText("—")[0]).toBeInTheDocument();
  });

  test("TimerDisplay renders remaining time", () => {
    render(<TimerDisplay remainingSeconds={17} />);
    expect(screen.getByText("Round Timer")).toBeInTheDocument();
    expect(screen.getByText("17s remaining")).toBeInTheDocument();
  });

  test("EntryPanel covers logged-out and logged-in branches", async () => {
    const onDraftAvatarUrlChange = vi.fn();
    const onDraftDisplayNameChange = vi.fn();
    const callbacks = {
      onGuestEntry: vi.fn(),
      onOAuthEntry: vi.fn(),
      onRegister: vi.fn(),
      onLogin: vi.fn(),
      onRenameGuest: vi.fn(),
      onUpdateAvatar: vi.fn(),
      onClearAvatar: vi.fn(),
      onLogout: vi.fn(),
      onSelectMode: vi.fn(),
    };

    const { rerender } = render(
      <EntryPanel
        session={null}
        loadState="ready"
        errorMessage="auth failed"
        selectedMode={null}
        draftDisplayName=""
        draftAvatarUrl=""
        onDraftDisplayNameChange={onDraftDisplayNameChange}
        onDraftAvatarUrlChange={onDraftAvatarUrlChange}
        {...callbacks}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("auth failed");
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "casey" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pw" } });
    fireEvent.keyDown(screen.getByLabelText("Password"), { key: "Enter" });
    expect(callbacks.onLogin).toHaveBeenCalledWith("casey", "pw");

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Casey" } });
    fireEvent.change(screen.getAllByLabelText("Username")[0], { target: { value: "casey2" } });
    fireEvent.change(screen.getAllByLabelText("Password")[0], { target: { value: "pw2" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(callbacks.onRegister).toHaveBeenCalledWith("casey2", "pw2", "Casey");

    fireEvent.click(screen.getByRole("button", { name: "Guest" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));
    expect(callbacks.onGuestEntry).toHaveBeenCalled();

    const fileInputClick = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:avatar"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });

    const drawImage = vi.fn();
    const toDataURL = vi.fn(() => "data:image/jpeg;base64,avatar");
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toDataURL,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 120;
      height = 60;
      set src(_value: string) {
        this.onload?.();
      }
    }
    vi.stubGlobal("Image", MockImage);

    rerender(
      <EntryPanel
        session={{
          sessionId: "s1",
          sessionType: "authenticated",
          status: "active",
          lastActivityAt: "2026-04-01T00:00:00Z",
          player: {
            playerId: "p1",
            identityType: "authenticated",
            displayName: "Alex",
            profileAvatar: "https://example.com/avatar.png",
          },
        }}
        loadState="ready"
        errorMessage={null}
        selectedMode="single_player"
        draftDisplayName="Renamed"
        draftAvatarUrl="data:image/jpeg;base64,draft"
        onDraftDisplayNameChange={onDraftDisplayNameChange}
        onDraftAvatarUrlChange={onDraftAvatarUrlChange}
        {...callbacks}
      />,
    );

    fireEvent.error(screen.getByAltText("Alex's avatar"));
    fireEvent.click(screen.getByRole("button", { name: "Change name" }));
    fireEvent.keyDown(screen.getByPlaceholderText("Alex"), { key: "Enter" });
    expect(callbacks.onRenameGuest).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Change name" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    expect(onDraftDisplayNameChange).toHaveBeenCalledWith("");

    fireEvent.click(screen.getByTitle("Change avatar"));
    const input = screen.getByLabelText("Upload avatar image");
    Object.defineProperty(HTMLInputElement.prototype, "click", {
      configurable: true,
      value: fileInputClick,
    });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(fileInputClick).toHaveBeenCalled();

    const file = new File(["image"], "avatar.png", { type: "image/png" });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLElement, {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(onDraftAvatarUrlChange).toHaveBeenCalledWith("data:image/jpeg;base64,avatar");
    });

    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    expect(callbacks.onUpdateAvatar).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Change avatar"));
    fireEvent.click(screen.getByRole("button", { name: "Remove avatar" }));
    expect(callbacks.onClearAvatar).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(callbacks.onLogout).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Single Player" }));
    fireEvent.click(screen.getByRole("button", { name: "Multiplayer" }));
    expect(callbacks.onSelectMode).toHaveBeenCalledWith("multiplayer");

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  test("EntryPanel covers cancel flows, non-image uploads, and sessions without saved avatar", async () => {
    const onDraftAvatarUrlChange = vi.fn();
    const onDraftDisplayNameChange = vi.fn();
    const callbacks = {
      onGuestEntry: vi.fn(),
      onOAuthEntry: vi.fn(),
      onRegister: vi.fn(),
      onLogin: vi.fn(),
      onRenameGuest: vi.fn(),
      onUpdateAvatar: vi.fn(),
      onClearAvatar: vi.fn(),
      onLogout: vi.fn(),
      onSelectMode: vi.fn(),
    };

    const view = render(
      <EntryPanel
        session={{
          sessionId: "s2",
          sessionType: "authenticated",
          status: "active",
          lastActivityAt: "2026-04-01T00:00:00Z",
          player: {
            playerId: "p2",
            identityType: "authenticated",
            displayName: "Blair",
            profileAvatar: "",
          },
        }}
        loadState="ready"
        errorMessage={null}
        selectedMode={null}
        draftDisplayName="Draft Blair"
        draftAvatarUrl="draft-avatar"
        onDraftDisplayNameChange={onDraftDisplayNameChange}
        onDraftAvatarUrlChange={onDraftAvatarUrlChange}
        {...callbacks}
      />,
    );

    fireEvent.click(within(view.container).getByRole("button", { name: "Change name" }));
    fireEvent.click(within(view.container).getAllByRole("button", { name: "Cancel" })[0]);
    expect(onDraftDisplayNameChange).toHaveBeenCalledWith("");

    fireEvent.click(within(view.container).getByTitle("Change avatar"));
    expect(within(view.container).queryByRole("button", { name: "Remove avatar" })).not.toBeInTheDocument();

    fireEvent.change(within(view.container).getByLabelText("Upload avatar image"), {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(onDraftAvatarUrlChange).not.toHaveBeenCalledWith(expect.stringContaining("data:image"));

    fireEvent.click(within(view.container).getAllByRole("button", { name: "Cancel" })[0]);
    expect(onDraftAvatarUrlChange).toHaveBeenCalledWith("");
  });

  test("EntryPanel covers upload placeholder and explicit cancel handlers", () => {
    const onDraftAvatarUrlChange = vi.fn();
    const onDraftDisplayNameChange = vi.fn();

    const view = render(
      <EntryPanel
        session={{
          sessionId: "s3",
          sessionType: "authenticated",
          status: "active",
          lastActivityAt: "2026-04-01T00:00:00Z",
          player: {
            playerId: "p3",
            identityType: "authenticated",
            displayName: "Casey",
            profileAvatar: "",
          },
        }}
        loadState="ready"
        errorMessage={null}
        selectedMode={null}
        draftDisplayName="Rename me"
        draftAvatarUrl=""
        onDraftDisplayNameChange={onDraftDisplayNameChange}
        onDraftAvatarUrlChange={onDraftAvatarUrlChange}
        onGuestEntry={vi.fn()}
        onOAuthEntry={vi.fn()}
        onRegister={vi.fn()}
        onLogin={vi.fn()}
        onRenameGuest={vi.fn()}
        onUpdateAvatar={vi.fn()}
        onClearAvatar={vi.fn()}
        onLogout={vi.fn()}
        onSelectMode={vi.fn()}
      />,
    );

    fireEvent.click(within(view.container).getByTitle("Change avatar"));
    expect(within(view.container).getByText("Drop image or click to upload")).toBeInTheDocument();

    fireEvent.click(within(view.container).getByRole("button", { name: "Change name" }));
    fireEvent.click(within(view.container).getAllByText("Cancel")[1]);
    expect(onDraftDisplayNameChange).toHaveBeenCalledWith("");
  });

  test("EntryPanel covers drag state and ignored file branches", () => {
    const onDraftAvatarUrlChange = vi.fn();
    const view = render(
      <EntryPanel
        session={{
          sessionId: "s4",
          sessionType: "authenticated",
          status: "active",
          lastActivityAt: "2026-04-01T00:00:00Z",
          player: {
            playerId: "p4",
            identityType: "authenticated",
            displayName: "Drew",
            profileAvatar: "",
          },
        }}
        loadState="ready"
        errorMessage={null}
        selectedMode={null}
        draftDisplayName=""
        draftAvatarUrl=""
        onDraftDisplayNameChange={vi.fn()}
        onDraftAvatarUrlChange={onDraftAvatarUrlChange}
        onGuestEntry={vi.fn()}
        onOAuthEntry={vi.fn()}
        onRegister={vi.fn()}
        onLogin={vi.fn()}
        onRenameGuest={vi.fn()}
        onUpdateAvatar={vi.fn()}
        onClearAvatar={vi.fn()}
        onLogout={vi.fn()}
        onSelectMode={vi.fn()}
      />,
    );

    fireEvent.click(within(view.container).getByTitle("Change avatar"));
    const upload = within(view.container).getByLabelText("Upload avatar image");

    fireEvent.dragOver(upload);
    expect(within(view.container).getByText("Drop it!")).toBeInTheDocument();

    fireEvent.dragLeave(upload);
    expect(within(view.container).getByText("Drop image or click to upload")).toBeInTheDocument();

    fireEvent.change(view.container.querySelector('input[type="file"]') as HTMLElement, {
      target: { files: [new File(["text"], "notes.txt", { type: "text/plain" })] },
    });
    fireEvent.drop(upload, { dataTransfer: { files: [] } });
    fireEvent.change(within(view.container).getByLabelText("Upload avatar image"), {
      target: { files: [] },
    });

    expect(onDraftAvatarUrlChange).not.toHaveBeenCalled();
  });

  test("HistoryPanel covers empty, expanded, and simulator branches", () => {
    const roomEntries = Array.from({ length: 4 }, (_, index) => ({
      scoreHistoryEntryId: `entry-${index + 1}`,
      scoreRecordId: `score-${index + 1}`,
      historyScope: "room_scoped" as const,
      displayName: `Player ${index + 1}`,
      score: 100 - index,
      rank: index + 1,
      similarityPercentage: 96 - index,
      roomId: "room-abc123",
      roundId: `round-${index + 1}`,
      targetColor: [255, 255, 0] as [number, number, number],
      blendedColor: index === 3 ? null : ([250, 240, 20] as [number, number, number]),
      roundNumber: index + 1,
      matchMode: "multiplayer" as const,
    }));

    const { rerender } = render(
      <HistoryPanel
        session={null}
        roomScopedHistory={[]}
        identityScopedHistory={[]}
      />,
    );

    expect(screen.getByText("No matches yet.")).toBeInTheDocument();
    expect(screen.getByText("Create an account to keep an all-time history across rooms and sessions.")).toBeInTheDocument();

    rerender(
      <HistoryPanel
        session={{
          sessionId: "s1",
          sessionType: "authenticated",
          status: "active",
          lastActivityAt: "2026-04-01T00:00:00Z",
          player: { playerId: "p1", identityType: "authenticated", displayName: "Alex", profileAvatar: "" },
        }}
        currentRoomId="room-abc123"
        roomScopedHistory={roomEntries}
        identityScopedHistory={[{ ...roomEntries[0], scoreHistoryEntryId: "identity-1", historyScope: "identity_scoped" as const, matchMode: "single_player" as const, roomId: null }]}
      />,
    );

    expect(screen.getByText("Current room history")).toBeInTheDocument();
    expect(screen.getByText("Showing results from the room you are currently in.")).toBeInTheDocument();
    expect(screen.getByText("All-time history")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show 1 more" }));
    expect(screen.getByText("#4")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Review" })[0]);
    expect(screen.getByText("Optimal blend to reach target:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try it →" }));
    expect(screen.getAllByText("Load optimal").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Hide simulator" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Hide" })[0]);
    expect(screen.queryByRole("button", { name: "Hide simulator" })).not.toBeInTheDocument();
  });

  test("HistoryPanel covers partial color review rows", () => {
    const view = render(
      <HistoryPanel
        session={null}
        roomScopedHistory={[
          {
            scoreHistoryEntryId: "entry-partial",
            scoreRecordId: "score-partial",
            historyScope: "room_scoped",
            displayName: "Player Partial",
            score: 88,
            rank: 2,
            similarityPercentage: 84,
            roomId: "room-partial",
            roundId: "round-partial",
            targetColor: [100, 110, 120],
            blendedColor: null,
            roundNumber: 2,
            matchMode: "multiplayer",
          },
        ]}
        identityScopedHistory={[]}
      />,
    );

    fireEvent.click(within(view.container).getByRole("button", { name: "Review" }));
    expect(within(view.container).getByTitle("RGB(100, 110, 120)")).toBeInTheDocument();
    expect(within(view.container).getByTitle("Unknown")).toBeInTheDocument();
    expect(within(view.container).getByText("Optimal blend to reach target:")).toBeInTheDocument();
    expect(within(view.container).queryByText(/Yours: RGB/)).not.toBeInTheDocument();
  });

  test("HistoryPanel covers expanded rows without optimal target controls", () => {
    const view = render(
      <HistoryPanel
        session={null}
        roomScopedHistory={[
          {
            scoreHistoryEntryId: "entry-blended-only",
            scoreRecordId: "score-blended-only",
            historyScope: "room_scoped",
            displayName: "Player Blend",
            score: 70,
            rank: 3,
            similarityPercentage: 70,
            roomId: null,
            roundId: "round-blended-only",
            targetColor: null,
            blendedColor: [10, 20, 30],
            roundNumber: 1,
            matchMode: "single_player",
          },
        ]}
        identityScopedHistory={[]}
      />,
    );

    fireEvent.click(within(view.container).getByRole("button", { name: "Review" }));
    expect(within(view.container).getByTitle("RGB(10, 20, 30)")).toBeInTheDocument();
    expect(within(view.container).queryByText("Optimal blend to reach target:")).not.toBeInTheDocument();
  });

  test("ResultsPanel covers winners, ties, crowd favorites, and simulator", () => {
    render(
      <ResultsPanel
        round={{
          roundId: "round-1",
          roundNumber: 2,
          roundStatus: "results",
          targetColor: [255, 255, 0],
          baseColorSet: FIXED_BASE_COLORS as [number, number, number][],
          timeLimit: 60,
          remainingSeconds: 0,
        }}
        results={[
          {
            playerId: "p1",
            displayName: "Alex",
            rank: 1,
            score: 98,
            similarityPercentage: 97,
            colorDistance: 1.11,
            tieBreakBasis: "exact_unrounded_color_distance",
            blendedColor: [255, 250, 0],
          },
          {
            playerId: "p2",
            displayName: "Blair",
            rank: 1,
            score: 98,
            similarityPercentage: 82,
            colorDistance: 4.25,
            tieBreakBasis: "exact_unrounded_color_distance",
            blendedColor: [245, 240, 15],
          },
          {
            playerId: "p3",
            displayName: "Casey",
            rank: 3,
            score: 50,
            similarityPercentage: 60,
            colorDistance: 20.5,
            tieBreakBasis: "submission_order",
            blendedColor: null,
          },
        ]}
        social={{
          presetMessages: [],
          interactions: [],
          submissionSummaries: [],
          crowdFavorites: [
            { playerId: "p1", displayName: "Alex" },
            { playerId: "p2", displayName: "Blair" },
          ],
        }}
      />,
    );

    expect(screen.getByText("Winners (tied): Alex, Blair")).toBeInTheDocument();
    expect(screen.getByText("Tie-break rule: exact unrounded color distance to the target.")).toBeInTheDocument();
    expect(screen.getByText("Crowd favorites (tied): Alex, Blair")).toBeInTheDocument();
    expect(screen.getByText(/Excellent match/)).toBeInTheDocument();
    expect(screen.getByText(/Close match/)).toBeInTheDocument();
    expect(screen.getByText(/Room to improve/)).toBeInTheDocument();
    expect(screen.getByText((text) => text.includes("No submission"))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try it →" }));
    expect(screen.getAllByText("Load optimal").length).toBeGreaterThan(0);
  });

  test("useAmbientMusic starts, crossfades, and stops", () => {
    vi.useFakeTimers();

    const oscillatorNodes: Array<{
      frequency: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> };
      detune: { value: number; setTargetAtTime: ReturnType<typeof vi.fn> };
      connect: ReturnType<typeof vi.fn>;
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
      type?: string;
    }> = [];

    const createGainNode = () => ({
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
    });

    class MockAudioContext {
      currentTime = 0;
      sampleRate = 10;
      destination = {};
      createGain = vi.fn(() => createGainNode());
      createConvolver = vi.fn(() => ({ buffer: null, connect: vi.fn() }));
      createBuffer = vi.fn((_channels: number, length: number) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
      }));
      createOscillator = vi.fn(() => {
        const node = {
          frequency: { value: 0, setTargetAtTime: vi.fn() },
          detune: { value: 0, setTargetAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          type: "sine",
        };
        oscillatorNodes.push(node);
        return node;
      });
      close = vi.fn();
    }

    vi.stubGlobal("AudioContext", MockAudioContext);

    const { result } = renderHook(() => useAmbientMusic());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.playing).toBe(true);
    expect(oscillatorNodes).toHaveLength(4);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(oscillatorNodes[0].frequency.setTargetAtTime).toHaveBeenCalled();
    expect(oscillatorNodes[1].detune.setTargetAtTime).toHaveBeenCalled();

    act(() => {
      result.current.toggle();
    });
    expect(result.current.playing).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    oscillatorNodes.forEach((node) => {
      expect(node.stop).toHaveBeenCalled();
    });
  });
});
