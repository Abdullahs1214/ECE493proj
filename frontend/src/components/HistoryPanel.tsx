import { useState } from "react";

import type { HistoryEntry, Session } from "../types/game";
import BlendSimulator from "./BlendSimulator";
import { computeOptimalWeights, FIXED_BASE_COLORS } from "../utils/colorUtils";

const RECENT_COUNT = 3;

interface HistoryPanelProps {
  session?: Session | null;
  roomScopedHistory: HistoryEntry[];
  identityScopedHistory: HistoryEntry[];
}

function shortRoomCode(roomId: string): string {
  return roomId.split("-")[0].toUpperCase();
}

function toRgb(color: [number, number, number] | null): string {
  if (!color) return "transparent";
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}

function ColorSwatch({ color, label }: { color: [number, number, number] | null; label: string }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span
        style={{
          display: "inline-block",
          width: "28px",
          height: "28px",
          borderRadius: "4px",
          background: toRgb(color),
          border: "1px solid rgba(0,0,0,0.15)",
        }}
        title={color ? `RGB(${color.join(", ")})` : "Unknown"}
      />
      <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>{label}</span>
    </span>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const optimalWeights = entry.targetColor
    ? computeOptimalWeights(FIXED_BASE_COLORS, entry.targetColor)
    : null;

  return (
    <li className="history-entry" style={{ flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", width: "100%", flexWrap: "wrap" }}>
        <span className={`history-rank history-rank--${entry.rank === 1 ? "gold" : "default"}`}>
          #{entry.rank}
        </span>
        <span className="history-detail">
          {entry.score} pts · {entry.similarityPercentage.toFixed(1)}%
        </span>
        <span className="history-match">
          {entry.matchMode === "multiplayer" && entry.roomId
            ? `Room ${shortRoomCode(entry.roomId)}`
            : "Solo"} · R{entry.roundNumber}
        </span>
        {(entry.targetColor || entry.blendedColor) ? (
          <button
            type="button"
            className="history-toggle-btn"
            style={{ marginLeft: "auto", fontSize: "0.75rem" }}
            onClick={() => { setExpanded((v) => !v); if (expanded) setShowSimulator(false); }}
          >
            {expanded ? "Hide" : "Review"}
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div style={{ width: "100%", paddingTop: "8px" }}>
          {/* Color comparison */}
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", paddingBottom: "8px" }}>
            <ColorSwatch color={entry.targetColor} label="Target" />
            <ColorSwatch color={entry.blendedColor} label="Yours" />
            {entry.targetColor && entry.blendedColor ? (
              <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                Target: RGB({entry.targetColor.join(", ")})<br />
                Yours: RGB({entry.blendedColor.join(", ")})
              </span>
            ) : null}
          </div>

          {/* Optimal blend */}
          {entry.targetColor && optimalWeights ? (
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "8px" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "0.82rem" }}>
                Optimal blend to reach target:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
                {FIXED_BASE_COLORS.map((color, i) => {
                  const pct = Math.round(optimalWeights[i] * 100);
                  if (pct === 0) return null;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: "28px",
                          height: "28px",
                          borderRadius: "4px",
                          background: `rgb(${color[0]},${color[1]},${color[2]})`,
                          border: "1px solid rgba(0,0,0,0.15)",
                        }}
                        title={`RGB(${color.join(", ")})`}
                      />
                      <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>{pct}%</span>
                    </div>
                  );
                })}
                <button
                  type="button"
                  className="history-toggle-btn"
                  style={{ fontSize: "0.75rem", alignSelf: "flex-end" }}
                  onClick={() => setShowSimulator((v) => !v)}
                >
                  {showSimulator ? "Hide simulator" : "Try it →"}
                </button>
              </div>

              {showSimulator ? (
                <BlendSimulator targetColor={entry.targetColor} initialWeights={optimalWeights} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function CollapsibleHistoryList({ entries, emptyText }: { entries: HistoryEntry[]; emptyText: string }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, RECENT_COUNT);
  const hasMore = entries.length > RECENT_COUNT;

  return (
    <>
      <ul className="member-list">
        {visible.length ? (
          visible.map((entry) => <HistoryRow key={entry.scoreHistoryEntryId} entry={entry} />)
        ) : (
          <li style={{ opacity: 0.5 }}>{emptyText}</li>
        )}
      </ul>
      {hasMore ? (
        <button
          type="button"
          className="history-toggle-btn"
          style={{ marginTop: "6px", fontSize: "0.8rem" }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : `Show ${entries.length - RECENT_COUNT} more`}
        </button>
      ) : null}
    </>
  );
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
      <CollapsibleHistoryList entries={roomScopedHistory} emptyText="No matches yet." />

      {session?.sessionType === "authenticated" ? (
        <>
          <h3 style={{ marginTop: "16px" }}>All-time history</h3>
          <CollapsibleHistoryList entries={identityScopedHistory} emptyText="No history yet." />
        </>
      ) : (
        <p style={{ marginTop: "12px", fontSize: "0.82rem", opacity: 0.5 }}>
          Create an account to keep an all-time history across sessions.
        </p>
      )}
    </section>
  );
}
