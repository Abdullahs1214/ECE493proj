import type { HistoryEntry, Session } from "../types/game";

interface HistoryPanelProps {
  session?: Session | null;
  roomScopedHistory: HistoryEntry[];
  identityScopedHistory: HistoryEntry[];
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
      <p>
        Signed in as{" "}
        {session ? `${session.player.displayName} (${session.sessionType})` : "no active player"}.
      </p>
      <p>
        Room-scoped history tracks the room matches you played. Authenticated players also keep a
        personal identity history across rooms and sessions.
      </p>
      <h3>Room-scoped history</h3>
      <ul className="member-list">
        {roomScopedHistory.length ? roomScopedHistory.map((entry) => (
          <li key={entry.scoreHistoryEntryId}>
            {entry.displayName} - {entry.score} points - rank {entry.rank} -{" "}
            {entry.roomId ? `room ${entry.roomId}` : "single-player local match"}
          </li>
        )) : <li>No room-scoped history yet.</li>}
      </ul>
      <h3>Identity-scoped history</h3>
      <p>
        {session?.sessionType === "authenticated"
          ? "Your signed-in identity keeps this history even after you leave a room."
          : "Identity-scoped history is available only for authenticated sessions."}
      </p>
      <ul className="member-list">
        {identityScopedHistory.length ? identityScopedHistory.map((entry) => (
          <li key={entry.scoreHistoryEntryId}>
            {entry.displayName} - {entry.score} points - rank {entry.rank} - round{" "}
            {entry.roundId}
          </li>
        )) : <li>No identity-scoped history yet.</li>}
      </ul>
    </section>
  );
}
