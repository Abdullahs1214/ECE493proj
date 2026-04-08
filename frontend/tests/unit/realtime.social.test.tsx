import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import SocialPanel from "../../src/components/SocialPanel";
import { subscribeToMatch, subscribeToRoom } from "../../src/services/realtimeClient";


class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.CONNECTING;
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });
  private listeners: Record<string, Array<(event?: any) => void>> = {
    message: [],
    close: [],
  };

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event?: any) => void) {
    this.listeners[type]?.push(handler);
  }

  emit(type: "message" | "close", event?: any) {
    this.listeners[type].forEach((handler) => handler(event));
  }
}


describe("realtime client and social panel", () => {
  afterEach(() => {
    MockWebSocket.instances = [];
    vi.unstubAllGlobals();
  });

  test("SocialPanel renders crowd favorite, disabled states, activity details, and enabled actions", () => {
    const onPresetMessage = vi.fn();
    const onUpvote = vi.fn();
    const onHighlight = vi.fn();

    render(
      <SocialPanel
        social={{
          presetMessages: ["Nice blend!"],
          interactions: [
            {
              socialInteractionId: "social-1",
              interactionType: "upvote",
              playerId: "player-1",
              displayName: "Player One",
              targetSubmissionId: "submission-1",
              targetDisplayName: "Player Two",
              presetMessage: "Nice blend!",
            },
            {
              socialInteractionId: "social-2",
              interactionType: "highlight",
              playerId: "player-2",
              displayName: "Player Two",
              targetSubmissionId: null,
              targetDisplayName: null,
              presetMessage: null,
            },
          ],
          submissionSummaries: [
            {
              submissionId: "submission-1",
              playerId: "player-1",
              displayName: "Player One",
              upvoteCount: 2,
              highlightCount: 1,
              hasUpvoted: true,
              hasHighlighted: true,
            },
            {
              submissionId: "submission-2",
              playerId: "player-2",
              displayName: "Player Two",
              upvoteCount: 0,
              highlightCount: 0,
              hasUpvoted: false,
              hasHighlighted: false,
            },
          ],
          crowdFavorite: {
            submissionId: "submission-1",
            playerId: "player-1",
            displayName: "Player One",
            reactionCount: 3,
          },
        }}
        onPresetMessage={onPresetMessage}
        onUpvote={onUpvote}
        onHighlight={onHighlight}
      />,
    );

    expect(screen.getByText("Crowd favorite: Player One with 3 reactions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upvoted" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Highlighted" })).toBeDisabled();
    expect(screen.getByText("Player One - upvote for Player Two - Nice blend!")).toBeInTheDocument();
    expect(screen.getByText("Player Two - highlight")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nice blend!" }));
    fireEvent.click(screen.getByRole("button", { name: "Upvote" }));
    fireEvent.click(screen.getByRole("button", { name: "Highlight" }));

    expect(onPresetMessage).toHaveBeenCalledWith("Nice blend!");
    expect(onUpvote).toHaveBeenCalledWith("submission-2");
    expect(onHighlight).toHaveBeenCalledWith("submission-2");
  });

  test("SocialPanel renders the no-crowd-favorite fallback", () => {
    render(
      <SocialPanel
        social={{
          presetMessages: [],
          interactions: [],
          submissionSummaries: [],
          crowdFavorite: null,
        }}
        onPresetMessage={vi.fn()}
        onUpvote={vi.fn()}
        onHighlight={vi.fn()}
      />,
    );

    expect(screen.getByText("Crowd favorite: none yet")).toBeInTheDocument();
  });

  test("subscribeToRoom parses messages and closes open sockets", () => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    const onMessage = vi.fn();
    const onClose = vi.fn();

    const unsubscribe = subscribeToRoom("room-1", onMessage, onClose);
    const socket = MockWebSocket.instances[0];

    expect(socket.url).toBe("ws://127.0.0.1:8000/ws/rooms/room-1/");

    socket.emit("message", {
      data: JSON.stringify({ event: "room_state_update", roomId: "room-1" }),
    });
    socket.emit("close");

    expect(onMessage).toHaveBeenCalledWith({ event: "room_state_update", roomId: "room-1" });
    expect(onClose).toHaveBeenCalledTimes(1);

    socket.readyState = MockWebSocket.OPEN;
    unsubscribe();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });

  test("subscribeToMatch does not close sockets that are already closed", () => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    const onMessage = vi.fn();

    const unsubscribe = subscribeToMatch("match-1", onMessage);
    const socket = MockWebSocket.instances[0];

    expect(socket.url).toBe("ws://127.0.0.1:8000/ws/matches/match-1/");

    socket.readyState = MockWebSocket.CLOSED;
    unsubscribe();

    expect(socket.close).not.toHaveBeenCalled();
  });
});
