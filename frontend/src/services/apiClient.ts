import type { PlayerIdentity, Session } from "../types/game";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

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
    throw new Error(`Request failed with status ${response.status}`);
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

export async function createGuestSession(displayName?: string): Promise<Session> {
  const payload = await request<{ session: Session }>("/sessions/guest/", {
    method: "POST",
    body: JSON.stringify(displayName ? { displayName } : {}),
  });

  return payload.session;
}

export async function getCurrentSession(): Promise<Session | null> {
  const response = await fetch(`${API_BASE_URL}/sessions/current/`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Partial<{ session: Session }>;
  return payload.session ?? null;
}

export async function updateCurrentSession(displayName: string): Promise<Session> {
  const payload = await request<{ session: Session }>("/sessions/current/update/", {
    method: "PATCH",
    body: JSON.stringify({ displayName }),
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
