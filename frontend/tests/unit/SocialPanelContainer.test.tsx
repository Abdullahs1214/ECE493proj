import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import SocialPanelContainer from "../../src/containers/SocialPanelContainer";


class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  private listeners: Record<string, Array<(event?: any) => void>> = {
    message: [],
    close: [],
  };

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: (event?: any) => void) {
    this.listeners[type]?.push(handler);
  }

  emit(type: "message" | "close", event?: any) {
    this.listeners[type].forEach((handler) => handler(event));
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  MockWebSocket.instances = [];
});


test("renders social state and submits a preset message", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        social: {
          presetMessages: ["Nice blend!", "Great match!", "So close!"],
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
        },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        social: {
          presetMessages: ["Nice blend!", "Great match!", "So close!"],
          interactions: [
            {
              socialInteractionId: "social-1",
              interactionType: "preset_message",
              playerId: "player-1",
              displayName: "Player One",
              targetSubmissionId: null,
              targetDisplayName: null,
              presetMessage: "Nice blend!",
            },
          ],
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
        },
      }),
    });
  vi.stubGlobal("fetch", fetchMock);

  const view = render(<SocialPanelContainer matchId="match-1" />);

  // SocialPanel renders immediately (not waiting for fetch)
  expect(screen.getByRole("heading", { name: "Social" })).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Nice blend!" })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: "Nice blend!" }));

  await waitFor(() => {
    expect(screen.getAllByText(/Nice blend!/).length).toBeGreaterThan(0);
  });

  view.unmount();
});

test("ignores realtime social refresh success after unmount", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  let resolveRefresh: ((value: unknown) => void) | undefined;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        social: {
          presetMessages: [],
          interactions: [],
          submissionSummaries: [],
          crowdFavorites: [],
        },
      }),
    })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );
  vi.stubGlobal("fetch", fetchMock);

  const view = render(<SocialPanelContainer matchId="match-success" />);

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  MockWebSocket.instances[0].emit("message", {
    data: JSON.stringify({ event: "social_interaction_update", matchId: "match-success" }),
  });

  view.unmount();

  await act(async () => {
    resolveRefresh?.({
      ok: true,
      status: 200,
      json: async () => ({
        social: {
          presetMessages: [],
          interactions: [],
          submissionSummaries: [],
          crowdFavorites: [],
        },
      }),
    });
    await Promise.resolve();
  });
});

test("ignores realtime social refresh failure after unmount", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  let rejectRefresh: ((reason?: unknown) => void) | undefined;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        social: {
          presetMessages: [],
          interactions: [],
          submissionSummaries: [],
          crowdFavorites: [],
        },
      }),
    })
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectRefresh = reject;
        }),
    );
  vi.stubGlobal("fetch", fetchMock);

  const view = render(<SocialPanelContainer matchId="match-failure" />);

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  MockWebSocket.instances[0].emit("message", {
    data: JSON.stringify({ event: "social_interaction_update", matchId: "match-failure" }),
  });

  view.unmount();

  await act(async () => {
    rejectRefresh?.(new Error("late social refresh failure"));
    await Promise.resolve();
  });
});

test("shows a load error when the initial social fetch fails", async () => {
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("initial social load failed")));

  render(<SocialPanelContainer matchId="match-load-error" />);

  await waitFor(() => {
    expect(screen.getByText("initial social load failed")).toBeInTheDocument();
  });
});
