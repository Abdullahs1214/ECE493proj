import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { useGameplayState } from "../../src/hooks/useGameplayState";


class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  private listeners = new Map<string, Array<(event?: { data: string }) => void>>();

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event?: { data: string }) => void) {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  emit(type: string, payload?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(payload === undefined ? undefined : { data: JSON.stringify(payload) });
    }
  }

  close() {
    this.readyState = 3;
    this.emit("close");
  }
}


function HookHarness() {
  const { gameplay } = useGameplayState({ mode: "single_player" });
  return <p>{gameplay ? `${gameplay.matchStatus}:${gameplay.round.remainingSeconds}` : "loading"}</p>;
}


test("useGameplayState updates from websocket timer events", async () => {
  MockWebSocket.instances = [];
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        gameplay: {
          matchId: "match-1",
          mode: "single_player",
          matchStatus: "active_round",
          currentRoundNumber: 1,
          round: {
            roundId: "round-1",
            roundNumber: 1,
            roundStatus: "active_blending",
            targetColor: [80, 90, 100],
            baseColorSet: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
            timeLimit: 60,
            remainingSeconds: 59,
          },
          submissions: [],
          results: [],
        },
      }),
    }),
  );
  vi.stubGlobal("WebSocket", MockWebSocket);

  render(<HookHarness />);

  await waitFor(() => {
    expect(screen.getByText("active_round:59")).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  MockWebSocket.instances[0].emit("message", {
    event: "connection_ready",
    scope: "match",
    topicId: "match-1",
  });
  MockWebSocket.instances[0].emit("message", {
    event: "timer_update",
    matchId: "match-1",
    gameplay: {
      matchId: "match-1",
      mode: "single_player",
      matchStatus: "active_round",
      currentRoundNumber: 1,
      round: {
        roundId: "round-1",
        roundNumber: 1,
        roundStatus: "active_blending",
        targetColor: [80, 90, 100],
        baseColorSet: [[255, 0, 0], [0, 255, 0], [0, 0, 255]],
        timeLimit: 60,
        remainingSeconds: 42,
      },
      submissions: [],
      results: [],
    },
  });

  await waitFor(() => {
    expect(screen.getByText("active_round:42")).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
