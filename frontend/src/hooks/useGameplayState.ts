import { useEffect, useState } from "react";

import { getGameplayState, startGameplay, submitGameplayColor } from "../services/apiClient";
import { subscribeToMatch } from "../services/realtimeClient";
import type { GameMode, GameplayState } from "../types/game";

interface UseGameplayStateArgs {
  mode: GameMode;
  roomId?: string;
  initialMatchId?: string;
}


export function useGameplayState({ mode, roomId, initialMatchId }: UseGameplayStateArgs) {
  const [gameplay, setGameplay] = useState<GameplayState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeReady, setRealtimeReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadGameplay = initialMatchId
      ? getGameplayState(initialMatchId)
      : startGameplay(mode, roomId);

    loadGameplay
      .then((state) => {
        if (!active) {
          return;
        }
        setGameplay(state);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Unable to start gameplay.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialMatchId, mode, roomId]);

  useEffect(() => {
    if (!gameplay) {
      return;
    }

    setRealtimeReady(false);
    return subscribeToMatch(
      gameplay.matchId,
      (message) => {
        if (message.event === "connection_ready") {
          setRealtimeReady(true);
          return;
        }
        if (
          message.event === "round_start_update" ||
          message.event === "timer_update" ||
          message.event === "submission_receipt_update" ||
          message.event === "scoring_update" ||
          message.event === "result_publication"
        ) {
          if (message.gameplay) {
            setGameplay(message.gameplay);
            setErrorMessage(null);
          }
          return;
        }
        if (message.event === "submission_rejection_update") {
          setErrorMessage(message.error ?? "Submission rejected.");
        }
      },
      () => {
        setRealtimeReady(false);
      },
    );
  }, [gameplay?.matchId]);

  useEffect(() => {
    if (!gameplay || gameplay.matchStatus !== "active_round" || realtimeReady) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const nextState = await getGameplayState(gameplay.matchId);
        setGameplay(nextState);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to refresh gameplay.");
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [gameplay, realtimeReady]);

  async function submitColor(blendedColor: number[]) {
    if (!gameplay) {
      return;
    }
    try {
      const nextState = await submitGameplayColor(gameplay.matchId, blendedColor);
      setGameplay(nextState);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit color.");
    }
  }

  return {
    gameplay,
    errorMessage,
    isLoading,
    realtimeReady,
    submitColor,
  };
}
