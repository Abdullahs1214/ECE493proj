import { afterEach, describe, expect, test, vi } from "vitest";

import {
  advanceRound,
  completeOAuthSignIn,
  deleteRoom,
  getCurrentRoom,
  getHealth,
  getRooms,
  loginLocalAccount,
  registerLocalAccount,
  signInWithOAuth,
  startOAuthSignIn,
  updateCurrentSession,
} from "../../src/services/apiClient";

describe("apiClient coverage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("covers auth, room, health, and gameplay helper branches", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: { sessionId: "registered" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: { sessionId: "logged-in" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ provider: "google", state: "state-1", authorizationUrl: "https://oauth.example/start" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: { sessionId: "oauth-session" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ provider: "github", state: "state-2", authorizationUrl: "https://oauth.example/redirect" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ room: { roomId: "room-1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rooms: [{ roomId: "room-2" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ roomClosed: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gameplay: { matchId: "match-2" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "room failure" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => {
          throw new Error("bad json");
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "unauthorized" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(registerLocalAccount("casey", "pw", "Casey")).resolves.toEqual({ sessionId: "registered" });
    await expect(loginLocalAccount("casey", "pw")).resolves.toEqual({ sessionId: "logged-in" });
    await expect(startOAuthSignIn("google")).resolves.toEqual({
      provider: "google",
      state: "state-1",
      authorizationUrl: "https://oauth.example/start",
    });
    await expect(completeOAuthSignIn("github", "state value/1")).resolves.toEqual({ sessionId: "oauth-session" });
    await expect(signInWithOAuth("github")).toEqual(expect.any(Promise));
    await expect(getCurrentRoom()).resolves.toEqual({ roomId: "room-1" });
    await expect(getRooms()).resolves.toEqual([{ roomId: "room-2" }]);
    await expect(deleteRoom("room-2")).resolves.toEqual({ roomClosed: true });
    await expect(advanceRound("match-2")).resolves.toEqual({ matchId: "match-2" });
    await expect(getHealth()).resolves.toEqual({ status: "ok" });
    await expect(getCurrentRoom()).rejects.toThrow("room failure");
    await expect(startOAuthSignIn("github")).rejects.toThrow("Request failed with status 403");
    await expect(completeOAuthSignIn("google", "bad-state")).rejects.toThrow("unauthorized");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/sessions/register/",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ username: "casey", password: "pw", displayName: "Casey" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/auth/oauth/start/?provider=google",
      { credentials: "include" },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/auth/oauth/complete/?provider=github&state=state%20value%2F1",
      { credentials: "include" },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      "http://localhost:8000/rooms/delete/",
      expect.objectContaining({ body: JSON.stringify({ roomId: "room-2" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      9,
      "http://localhost:8000/gameplay/advance/",
      expect.objectContaining({ body: JSON.stringify({ matchId: "match-2" }) }),
    );
  });

  test("returns null for unauthorized current room", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "No room" }),
      }),
    );

    await expect(getCurrentRoom()).resolves.toBeNull();
  });

  test("updateCurrentSession omits undefined displayName and keeps empty avatar values", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ session: { sessionId: "updated" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateCurrentSession(undefined, "")).resolves.toEqual({ sessionId: "updated" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/sessions/current/update/",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ profileAvatar: "" }),
      }),
    );
  });
});
