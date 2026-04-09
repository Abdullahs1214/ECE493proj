import { useEffect, useState } from "react";

import HistoryPanel from "../components/HistoryPanel";
import { getHistory } from "../services/apiClient";
import type { HistoryEntry, Session } from "../types/game";

interface HistoryContainerProps {
  session?: Session | null;
}

export default function HistoryContainer({ session = null }: HistoryContainerProps) {
  const [roomScopedHistory, setRoomScopedHistory] = useState<HistoryEntry[]>([]);
  const [identityScopedHistory, setIdentityScopedHistory] = useState<HistoryEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getHistory()
      .then((history) => {
        if (!active) {
          return;
        }
        setRoomScopedHistory(history.roomScopedHistory);
        setIdentityScopedHistory(history.identityScopedHistory);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Unable to load history.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (errorMessage) {
    return <section className="status-card">{errorMessage}</section>;
  }

  return (
    <HistoryPanel
      session={session}
      roomScopedHistory={roomScopedHistory}
      identityScopedHistory={identityScopedHistory}
    />
  );
}
