import { useEffect, useState } from "react";

import {
  createGuestSession,
  getCurrentSession,
  logoutSession,
  updateCurrentSession,
} from "../services/apiClient";
import type { Session } from "../types/game";

type LoadState = "idle" | "loading" | "ready" | "error";

export function useSessionState() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getCurrentSession()
      .then((currentSession) => {
        if (!active) {
          return;
        }
        setSession(currentSession);
        setLoadState("ready");
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setErrorMessage("Unable to load the current session.");
        setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  async function enterAsGuest(displayName?: string) {
    setErrorMessage(null);
    const nextSession = await createGuestSession(displayName);
    setSession(nextSession);
    setLoadState("ready");
  }

  async function renameGuest(displayName: string) {
    setErrorMessage(null);
    const nextSession = await updateCurrentSession(displayName);
    setSession(nextSession);
  }

  async function clearSession() {
    setErrorMessage(null);
    await logoutSession();
    setSession(null);
  }

  return {
    session,
    loadState,
    errorMessage,
    enterAsGuest,
    renameGuest,
    clearSession,
  };
}
