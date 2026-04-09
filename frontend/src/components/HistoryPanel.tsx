import type { HistoryEntry, Session } from "../types/game";

interface HistoryPanelProps {
  session?: Session | null;
  roomScopedHistory: HistoryEntry[];
  identityScopedHistory: HistoryEntry[];
}

function shortRoomCode(roomId: string): string {
  return roomId.split("-")[0].toUpperCase();
}


export default function HistoryPanel({
  session,
  roomScopedHistory,
  identityScopedHistory,
}: HistoryPanelProps) {
  return (
    <section className="status-card">
      <p className="eyebrow">History</p>
      <h2>Score History</h2>

      <h3>Recent matches</h3>
      <ul className="member-list">
        {roomScopedHistory.length ? (
          roomScopedHistory.map((entry) => (
            <li key={entry.scoreHistoryEntryId} className="history-entry">
              <span className={`history-rank history-rank--${entry.rank === 1 ? "gold" : "default"}`}>
                #{entry.rank}
              </span>
              <span className="history-detail">
                {entry.score} pts · {entry.similarityPercentage}%
              </span>
              <span className="history-match">
                {entry.roomId ? `Room ${shortRoomCode(entry.roomId)}` : "Solo"}
              </span>
            </li>
          ))
        ) : (
          <li style={{ opacity: 0.5 }}>No matches yet.</li>
        )}
      </ul>

      {session?.sessionType === "authenticated" ? (
        <>
          <h3 style={{ marginTop: "16px" }}>All-time history</h3>
          <ul className="member-list">
            {identityScopedHistory.length ? (
              identityScopedHistory.map((entry) => (
                <li key={entry.scoreHistoryEntryId} className="history-entry">
                  <span className={`history-rank history-rank--${entry.rank === 1 ? "gold" : "default"}`}>
                    #{entry.rank}
                  </span>
                  <span className="history-detail">
                    {entry.score} pts · {entry.similarityPercentage}%
                  </span>
                  <span className="history-match">
                    {entry.roomId ? `Room ${shortRoomCode(entry.roomId)}` : "Solo"}
                  </span>
                </li>
              ))
            ) : (
              <li style={{ opacity: 0.5 }}>No history yet.</li>
            )}
          </ul>
        </>
      ) : (
        <p style={{ marginTop: "12px", fontSize: "0.82rem", opacity: 0.5 }}>
          Sign in to keep an all-time history across sessions.
        </p>
      )}
    </section>
  );
}
