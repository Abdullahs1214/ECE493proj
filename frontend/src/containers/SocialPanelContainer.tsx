import { useEffect, useRef, useState } from "react";

import SocialPanel from "../components/SocialPanel";
import { getSocialState, submitSocialInteraction } from "../services/apiClient";
import { subscribeToMatch } from "../services/realtimeClient";
import type { SocialInteractionEntry, SocialInteractionState } from "../types/game";

interface Toast {
  id: string;
  label: string;
  addedAt: number;
}

function formatLabel(interaction: SocialInteractionEntry): string {
  if (interaction.interactionType === "preset_message") {
    return `${interaction.displayName}: "${interaction.presetMessage}"`;
  }
  if (interaction.interactionType === "upvote") {
    return `${interaction.displayName} upvoted ${interaction.targetDisplayName ?? "a submission"}`;
  }
  if (interaction.interactionType === "highlight") {
    return `${interaction.displayName} highlighted ${interaction.targetDisplayName ?? "a submission"}`;
  }
  return `${interaction.displayName} — ${interaction.interactionType}`;
}

const TOAST_DURATION_MS = 4000;

interface SocialPanelContainerProps {
  matchId: string;
  currentPlayerId?: string;
  onStateChange?: (social: SocialInteractionState) => void;
}

export default function SocialPanelContainer({
  matchId,
  currentPlayerId,
  onStateChange,
}: SocialPanelContainerProps) {
  const [social, setSocial] = useState<SocialInteractionState>({
    presetMessages: [],
    interactions: [],
    submissionSummaries: [],
    crowdFavorites: [],
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const seenIds = useRef(new Set<string>());

  function applyState(state: SocialInteractionState) {
    const newInteractions = state.interactions.filter(
      (i) => !seenIds.current.has(i.socialInteractionId),
    );
    newInteractions.forEach((i) => seenIds.current.add(i.socialInteractionId));

    if (newInteractions.length > 0) {
      const now = Date.now();
      setToasts((prev) => [
        ...prev,
        ...newInteractions.map((i) => ({
          id: i.socialInteractionId,
          label: formatLabel(i),
          addedAt: now,
        })),
      ]);
    }

    setSocial(state);
    onStateChange?.(state);
  }

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      const cutoff = Date.now() - TOAST_DURATION_MS;
      setToasts((prev) => prev.filter((t) => t.addedAt > cutoff));
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    let active = true;
    getSocialState(matchId)
      .then((state) => {
        if (active) applyState(state);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load social state.");
        }
      });
    return () => {
      active = false;
    };
  }, [matchId]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToMatch(matchId, (message) => {
      if (message.event !== "social_interaction_update") return;
      getSocialState(matchId)
        .then((state) => {
          if (!active) return;
          applyState(state);
          setErrorMessage(null);
        })
        .catch((error) => {
          if (!active) return;
          setErrorMessage(error instanceof Error ? error.message : "Unable to load social state.");
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [matchId]);

  async function submitAndRefresh(
    interactionType: SocialInteractionEntry["interactionType"],
    targetSubmissionId?: string,
    presetMessage?: string,
  ) {
    const nextSocial = await submitSocialInteraction(
      matchId,
      interactionType,
      targetSubmissionId,
      presetMessage,
    );
    applyState(nextSocial);
    setErrorMessage(null);
  }

  if (errorMessage) {
    return <section className="status-card">{errorMessage}</section>;
  }

  return (
    <SocialPanel
      social={social}
      toasts={toasts}
      currentPlayerId={currentPlayerId}
      onPresetMessage={(message) => submitAndRefresh("preset_message", undefined, message)}
      onUpvote={(target) => submitAndRefresh("upvote", target)}
      onHighlight={(target) => submitAndRefresh("highlight", target)}
    />
  );
}
