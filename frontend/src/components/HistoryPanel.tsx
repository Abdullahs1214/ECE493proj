import type { HistoryEntry } from "../types/game";

interface HistoryPanelProps {
  roomScopedHistory: HistoryEntry[];
  identityScopedHistory: HistoryEntry[];
}


export default function HistoryPanel({
  roomScopedHistory,
  identityScopedHistory,
}: HistoryPanelProps) {
  return (
    <section className="status-card">
      <p className="eyebrow">History</p>
      <h2>Score History</h2>
      <h3>Room-scoped history</h3>
      <ul className="member-list">
        {roomScopedHistory.map((entry) => (
          <li key={entry.scoreHistoryEntryId}>
            {entry.displayName} - {entry.score} points - rank {entry.rank}
          </li>
        ))}
      </ul>
      <h3>Identity-scoped history</h3>
      <ul className="member-list">
        {identityScopedHistory.map((entry) => (
          <li key={entry.scoreHistoryEntryId}>
            {entry.displayName} - {entry.score} points - rank {entry.rank}
          </li>
        ))}
      </ul>
    </section>
  );
}
