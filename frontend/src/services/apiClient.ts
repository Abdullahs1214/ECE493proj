import type {
  GameplayState,
  HistoryEntry,
  PlayerIdentity,
  Room,
  Session,
  SocialInteractionEntry,
  SocialInteractionState,
} from "../types/game";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function toError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as Partial<{ error: string }>;
    if (typeof payload.error === "string" && payload.error.trim()) {
      return new Error(payload.error);
    }
  } catch {
    // Ignore invalid or empty error payloads and fall back to status-based errors.
  }

  return new Error(`Request failed with status ${response.status}`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  return response.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health/`);

  if (!response.ok) {
    throw new Error("Health check failed");
  }

  return response.json();
}

export async function registerLocalAccount(
  username: string,
  password: string,
  displayName: string,
): Promise<Session> {
  const payload = await request<{ session: Session }>("/sessions/register/", {
    method: "POST",
    body: JSON.stringify({ username, password, displayName }),
  });
  return payload.session;
}

export async function loginLocalAccount(username: string, password: string): Promise<Session> {
  const payload = await request<{ session: Session }>("/sessions/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return payload.session;
}

export async function createGuestSession(displayName?: string): Promise<Session> {
  const payload = await request<{ session: Session }>("/sessions/guest/", {
    method: "POST",
    body: JSON.stringify(displayName ? { displayName } : {}),
  });

  return payload.session;
}

export async function startOAuthSignIn(provider: "google" | "github"): Promise<{
  provider: string;
  state: string;
  authorizationUrl: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/auth/oauth/start/?provider=${encodeURIComponent(provider)}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw await toError(response);
  }

  return response.json();
}

export async function completeOAuthSignIn(
  provider: "google" | "github",
  state: string,
): Promise<Session> {
  const response = await fetch(
    `${API_BASE_URL}/auth/oauth/complete/?provider=${encodeURIComponent(provider)}&state=${encodeURIComponent(state)}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw await toError(response);
  }

  const payload = (await response.json()) as { session: Session };
  return payload.session;
}

export async function signInWithOAuth(provider: "google" | "github"): Promise<Session> {
  const { authorizationUrl } = await startOAuthSignIn(provider);
  window.location.assign(authorizationUrl);
  return new Promise(() => undefined);
}

export async function getCurrentSession(): Promise<Session | null> {
  const response = await fetch(`${API_BASE_URL}/sessions/current/`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw await toError(response);
  }

  const payload = (await response.json()) as Partial<{ session: Session }>;
  return payload.session ?? null;
}

export async function updateCurrentSession(
  displayName?: string,
  profileAvatar?: string,
): Promise<Session> {
  const body: Record<string, string> = {};
  if (displayName) body.displayName = displayName;
  if (profileAvatar !== undefined) body.profileAvatar = profileAvatar;
  const payload = await request<{ session: Session }>("/sessions/current/update/", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return payload.session;
}

export async function logoutSession(): Promise<void> {
  await request<{ loggedOut: boolean }>("/sessions/logout/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getProfile(): Promise<PlayerIdentity> {
  const payload = await request<{ profile: PlayerIdentity }>("/profile/");
  return payload.profile;
}

export async function createRoom(): Promise<Room> {
  const payload = await request<{ room: Room }>("/rooms/create/", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return payload.room;
}

export async function getRooms(): Promise<Room[]> {
  const payload = await request<{ rooms: Room[] }>("/rooms/", {
    method: "GET",
  });
  return payload.rooms;
}

export async function getCurrentRoom(): Promise<Room | null> {
  const response = await fetch(`${API_BASE_URL}/rooms/current/`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw await toError(response);
  }

  const payload = (await response.json()) as { room: Room | null };
  return payload.room ?? null;
}

export async function joinRoom(roomId: string): Promise<Room> {
  const payload = await request<{ room: Room }>("/rooms/join/", {
    method: "POST",
    body: JSON.stringify({ roomId }),
  });
  return payload.room;
}

export async function leaveRoom(
  roomId: string,
): Promise<{ leftRoom: boolean; roomClosed: boolean; room: Room | null }> {
  return request<{ leftRoom: boolean; roomClosed: boolean; room: Room | null }>(
    "/rooms/leave/",
    {
      method: "POST",
      body: JSON.stringify({ roomId }),
    },
  );
}

export async function deleteRoom(roomId: string): Promise<{ roomClosed: boolean }> {
  return request<{ roomClosed: boolean }>("/rooms/delete/", {
    method: "POST",
    body: JSON.stringify({ roomId }),
  });
}

export async function startGameplay(mode: "single_player" | "multiplayer", roomId?: string) {
  const payload = await request<{ gameplay: GameplayState }>("/gameplay/start/", {
    method: "POST",
    body: JSON.stringify(roomId ? { mode, roomId } : { mode }),
  });
  return payload.gameplay;
}

export async function submitGameplayColor(matchId: string, mixWeights: number[]) {
  const payload = await request<{ gameplay: GameplayState }>("/gameplay/submit/", {
    method: "POST",
    body: JSON.stringify({ matchId, mixWeights }),
  });
  return payload.gameplay;
}

export async function advanceRound(matchId: string): Promise<GameplayState> {
  const payload = await request<{ gameplay: GameplayState }>("/gameplay/advance/", {
    method: "POST",
    body: JSON.stringify({ matchId }),
  });
  return payload.gameplay;
}

export async function getGameplayState(matchId: string) {
  const response = await fetch(
    `${API_BASE_URL}/gameplay/state/?matchId=${encodeURIComponent(matchId)}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw await toError(response);
  }

  const payload = (await response.json()) as { gameplay: GameplayState };
  return payload.gameplay;
}

export async function getHistory(): Promise<{
  roomScopedHistory: HistoryEntry[];
  identityScopedHistory: HistoryEntry[];
}> {
  const payload = await request<{
    history: { roomScopedHistory: HistoryEntry[]; identityScopedHistory: HistoryEntry[] };
  }>("/history/", {
    method: "GET",
  });
  return payload.history;
}

export async function getSocialState(matchId: string): Promise<SocialInteractionState> {
  const response = await fetch(
    `${API_BASE_URL}/social/state/?matchId=${encodeURIComponent(matchId)}`,
    {
      credentials: "include",
    },
  );
  if (!response.ok) {
    throw await toError(response);
  }
  const payload = (await response.json()) as { social: SocialInteractionState };
  return payload.social;
}

export async function submitSocialInteraction(
  matchId: string,
  interactionType: SocialInteractionEntry["interactionType"],
  targetSubmissionId?: string,
  presetMessage?: string,
): Promise<SocialInteractionState> {
  const payload = await request<{ social: SocialInteractionState }>("/social/submit/", {
    method: "POST",
    body: JSON.stringify({
      matchId,
      interactionType,
      targetSubmissionId,
      presetMessage,
    }),
  });
  return payload.social;
}
