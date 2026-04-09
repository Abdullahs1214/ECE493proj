import { afterEach, describe, expect, test, vi } from "vitest";

import {
  createGuestSession,
  createRoom,
  getCurrentSession,
  getGameplayState,
  getHealth,
  getHistory,
  getProfile,
  getSocialState,
  joinRoom,
  leaveRoom,
  logoutSession,
  startGameplay,
  submitGameplayColor,
  submitSocialInteraction,
  updateCurrentSession,
} from "../../src/services/apiClient";


describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("returns parsed payloads for request-backed API helpers", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: { sessionId: "guest-1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: { sessionId: "session-2" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ loggedOut: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: { playerId: "player-1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ room: { roomId: "room-1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ room: { roomId: "room-2" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ leftRoom: true, roomClosed: false, room: { roomId: "room-2" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gameplay: { matchId: "match-1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gameplay: { matchId: "match-2" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ history: { roomScopedHistory: [], identityScopedHistory: [] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ social: { interactions: [] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ social: { interactions: [{ interactionType: "upvote" }] } }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(createGuestSession()).resolves.toEqual({ sessionId: "guest-1" });
    await expect(updateCurrentSession("Casey")).resolves.toEqual({ sessionId: "session-2" });
    await expect(logoutSession()).resolves.toBeUndefined();
    await expect(getProfile()).resolves.toEqual({ playerId: "player-1" });
    await expect(createRoom()).resolves.toEqual({ roomId: "room-1" });
    await expect(joinRoom("room-2")).resolves.toEqual({ roomId: "room-2" });
    await expect(leaveRoom("room-2")).resolves.toEqual({
      leftRoom: true,
      roomClosed: false,
      room: { roomId: "room-2" },
    });
    await expect(startGameplay("single_player")).resolves.toEqual({ matchId: "match-1" });
    await expect(submitGameplayColor("match-1", [1, 2, 3])).resolves.toEqual({ matchId: "match-2" });
    await expect(getHistory()).resolves.toEqual({ roomScopedHistory: [], identityScopedHistory: [] });
    await expect(getSocialState("match-1")).resolves.toEqual({ interactions: [] });
    await expect(
      submitSocialInteraction("match-1", "upvote", "submission-1", "Nice blend!"),
    ).resolves.toEqual({ interactions: [{ interactionType: "upvote" }] });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/sessions/guest/",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: "{}",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      "http://localhost:8000/gameplay/start/",
      expect.objectContaining({ body: JSON.stringify({ mode: "single_player" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      12,
      "http://localhost:8000/social/submit/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          matchId: "match-1",
          interactionType: "upvote",
          targetSubmissionId: "submission-1",
          presetMessage: "Nice blend!",
        }),
      }),
    );
  });

  test("covers conditional session and gameplay fetch flows", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ session: { sessionId: "session-3" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gameplay: { matchId: "existing-match" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ gameplay: { matchId: "room-match" } }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentSession()).resolves.toBeNull();
    await expect(getCurrentSession()).resolves.toBeNull();
    await expect(getCurrentSession()).resolves.toEqual({ sessionId: "session-3" });
    await expect(getGameplayState("match value/1")).resolves.toEqual({ matchId: "existing-match" });
    await expect(startGameplay("multiplayer", "room value/2")).resolves.toEqual({ matchId: "room-match" });

    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:8000/gameplay/state/?matchId=match%20value%2F1",
      { credentials: "include" },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      "http://localhost:8000/gameplay/start/",
      expect.objectContaining({
        body: JSON.stringify({ mode: "multiplayer", roomId: "room value/2" }),
      }),
    );
  });

  test("throws on request, health, gameplay, social, and current-session failures", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 418 })
      .mockResolvedValueOnce({ ok: false, status: 409 })
      .mockResolvedValueOnce({ status: 500, ok: false });

    vi.stubGlobal("fetch", fetchMock);

    await expect(createRoom()).rejects.toThrow("Request failed with status 500");
    await expect(getHealth()).rejects.toThrow("Health check failed");
    await expect(getGameplayState("match-1")).rejects.toThrow("Request failed with status 418");
    await expect(getSocialState("match-1")).rejects.toThrow("Request failed with status 409");
    await expect(getCurrentSession()).rejects.toThrow("Request failed with status 500");
  });

  test("sends displayName when creating a guest session with a provided name", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ session: { sessionId: "guest-named" } }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(createGuestSession("Casey")).resolves.toEqual({ sessionId: "guest-named" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/sessions/guest/",
      expect.objectContaining({
        body: JSON.stringify({ displayName: "Casey" }),
      }),
    );
  });
});
