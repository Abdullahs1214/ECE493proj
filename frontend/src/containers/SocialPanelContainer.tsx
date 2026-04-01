import { useEffect, useState } from "react";

import SocialPanel from "../components/SocialPanel";
import { getSocialState, submitSocialInteraction } from "../services/apiClient";
import type { SocialInteractionEntry, SocialInteractionState } from "../types/game";

interface SocialPanelContainerProps {
  matchId: string;
  onStateChange?: (social: SocialInteractionState) => void;
}


export default function SocialPanelContainer({
  matchId,
  onStateChange,
}: SocialPanelContainerProps) {
  const [social, setSocial] = useState<SocialInteractionState>({
    presetMessages: [],
    interactions: [],
    submissionSummaries: [],
    crowdFavorite: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getSocialState(matchId)
      .then((state) => {
        if (active) {
          setSocial(state);
          setErrorMessage(null);
          onStateChange?.(state);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load social state.");
        }
      });

    return () => {
      active = false;
    };
  }, [matchId, onStateChange]);

  async function submitAndRefresh(
    interactionType: SocialInteractionEntry["interactionType"],
    targetSubmissionId?: string,
    presetMessage?: string,
  ) {
    const nextSocial = await submitSocialInteraction(matchId, interactionType, targetSubmissionId, presetMessage);
    setSocial(nextSocial);
    setErrorMessage(null);
    onStateChange?.(nextSocial);
  }

  if (errorMessage) {
    return <section className="status-card">{errorMessage}</section>;
  }

  return (
    <SocialPanel
      social={social}
      onPresetMessage={(message) => submitAndRefresh("preset_message", undefined, message)}
      onUpvote={(target) => submitAndRefresh("upvote", target)}
      onHighlight={(target) => submitAndRefresh("highlight", target)}
    />
  );
}
