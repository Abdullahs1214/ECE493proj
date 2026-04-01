import { useEffect, useState } from "react";

import { getGameplayState, startGameplay, submitGameplayColor } from "../services/apiClient";
import type { GameMode, GameplayState } from "../types/game";

interface UseGameplayStateArgs {
  mode: GameMode;
  roomId?: string;
}


export function useGameplayState({ mode, roomId }: UseGameplayStateArgs) {
  const [gameplay, setGameplay] = useState<GameplayState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    startGameplay(mode, roomId)
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
  }, [mode, roomId]);

  useEffect(() => {
    if (!gameplay || gameplay.matchStatus !== "active_round") {
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
  }, [gameplay]);

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
    submitColor,
  };
}
