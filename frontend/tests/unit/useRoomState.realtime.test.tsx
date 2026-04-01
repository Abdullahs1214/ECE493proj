import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { useRoomState } from "../../src/hooks/useRoomState";


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
  const { room, activeMatchId, createRoom } = useRoomState();

  return (
    <div>
      <button type="button" onClick={() => createRoom()}>
        Create room
      </button>
      <p>{room ? room.hostDisplayName : "no-room"}</p>
      <p>{activeMatchId ?? "no-match"}</p>
    </div>
  );
}


test("useRoomState consumes room and match realtime updates", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        room: {
          roomId: "room-1",
          roomStatus: "open",
          hostPlayerId: "player-1",
          hostDisplayName: "Host Player",
          members: [],
        },
      }),
    }),
  );
  vi.stubGlobal("WebSocket", MockWebSocket);

  render(<HookHarness />);
  fireEvent.click(screen.getByText("Create room"));

  await waitFor(() => {
    expect(screen.getByText("Host Player")).toBeInTheDocument();
  });

  MockWebSocket.instances[0].emit("message", {
    event: "match_start_update",
    roomId: "room-1",
    matchId: "match-1",
  });

  await waitFor(() => {
    expect(screen.getByText("match-1")).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
