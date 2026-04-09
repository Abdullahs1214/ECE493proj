import { useEffect, useState } from "react";

import {
  createGuestSession,
  signInWithOAuth,
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

  useEffect(() => {
    const url = new URL(window.location.href);
    const oauthStatus = url.searchParams.get("oauthStatus");
    if (!oauthStatus) {
      return;
    }

    if (oauthStatus === "success") {
      setLoadState("loading");
      getCurrentSession()
        .then((currentSession) => {
          setSession(currentSession);
          setErrorMessage(null);
          setLoadState("ready");
        })
        .catch(() => {
          setErrorMessage("OAuth sign-in completed, but the session could not be restored.");
          setLoadState("error");
        });
    } else if (oauthStatus === "cancelled") {
      setErrorMessage("OAuth sign-in was cancelled or denied.");
    } else if (oauthStatus === "failed") {
      setErrorMessage("OAuth sign-in failed.");
    } else {
      setErrorMessage(null);
    }

    url.searchParams.delete("oauthStatus");
    window.history.replaceState({}, "", url.toString());
  }, []);

  async function enterAsGuest(displayName?: string) {
    setErrorMessage(null);
    try {
      const nextSession = await createGuestSession(displayName);
      setSession(nextSession);
      setLoadState("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create a guest session.");
      setLoadState("error");
    }
  }

  async function enterWithOAuth(provider: "google" | "github") {
    setErrorMessage(null);
    try {
      const nextSession = await signInWithOAuth(provider);
      setSession(nextSession);
      setLoadState("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start OAuth sign-in.");
      setLoadState("ready");
    }
  }

  async function renameGuest(displayName: string) {
    setErrorMessage(null);
    try {
      const nextSession = await updateCurrentSession(displayName);
      setSession(nextSession);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the guest name.");
    }
  }

  async function clearSession() {
    setErrorMessage(null);
    try {
      await logoutSession();
      setSession(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log out.");
    }
  }

  return {
    session,
    loadState,
    errorMessage,
    enterAsGuest,
    enterWithOAuth,
    renameGuest,
    clearSession,
  };
}
