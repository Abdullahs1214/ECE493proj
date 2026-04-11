import { useState } from "react";

import type { SocialInteractionState } from "../types/game";

interface Toast {
  id: string;
  label: string;
  addedAt: number;
}

interface SocialPanelProps {
  social: SocialInteractionState;
  toasts: Toast[];
  currentPlayerId?: string;
  onPresetMessage: (message: string) => void;
  onUpvote: (submissionId: string) => void;
  onHighlight: (submissionId: string) => void;
}

export default function SocialPanel({
  social,
  toasts,
  currentPlayerId,
  onPresetMessage,
  onUpvote,
  onHighlight,
}: SocialPanelProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <section className="status-card">
      <p className="eyebrow">Social</p>
      <h2>Social</h2>

      {social.crowdFavorites.length > 0 ? (
        <p>
          {/* c8 ignore next */}
          Crowd favorite{social.crowdFavorites.length > 1 ? "s (tied)" : ""}:{" "}
          <strong>
            {social.crowdFavorites.map((f) => f.displayName).join(", ")}
          </strong>{" "}
          — {social.crowdFavorites[0].reactionCount} reaction
          {social.crowdFavorites[0].reactionCount !== 1 ? "s" : ""}
        </p>
      ) : (
        <p style={{ opacity: 0.5 }}>No crowd favorite yet.</p>
      )}

      {/* Preset messages */}
      <div className="actions" aria-label="Preset messages">
        {social.presetMessages.map((message) => (
          <button type="button" key={message} onClick={() => onPresetMessage(message)}>
            {message}
          </button>
        ))}
      </div>

      {/* Toast activity feed */}
      {toasts.length > 0 ? (
        <div className="toast-feed" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className="toast-item">
              {toast.label}
            </div>
          ))}
        </div>
      ) : null}

      {/* History toggle */}
      {social.interactions.length > 0 ? (
        <button
          type="button"
          className="history-toggle-btn"
          onClick={() => setShowHistory((v) => !v)}
        >
          {showHistory ? "Hide history" : `Show history (${social.interactions.length})`}
        </button>
      ) : null}

      {showHistory ? (
        <ul className="member-list activity-history">
          {social.interactions.map((interaction) => {
            let label = "";
            if (interaction.interactionType === "preset_message") {
              label = `${interaction.displayName}: "${interaction.presetMessage}"`;
            } else if (interaction.interactionType === "upvote") {
              label = `${interaction.displayName} upvoted ${interaction.targetDisplayName ?? "a submission"}`;
            } else if (interaction.interactionType === "highlight") {
              label = `${interaction.displayName} highlighted ${interaction.targetDisplayName ?? "a submission"}`;
            } else {
              label = `${interaction.displayName} — ${interaction.interactionType}`;
            }
            return <li key={interaction.socialInteractionId}>{label}</li>;
          })}
        </ul>
      ) : null}

      {/* Submission reactions */}
      <h3>Reactions</h3>
      <ul className="member-list">
        {social.submissionSummaries.length ? (
          social.submissionSummaries.map((submission) => {
            const isOwn = currentPlayerId === submission.playerId;
            return (
              <li key={submission.submissionId} className="social-submission-row">
                <span>
                  <strong>{submission.displayName}</strong>
                  {isOwn ? " (you)" : ""} — {submission.upvoteCount} upvote
                  {submission.upvoteCount !== 1 ? "s" : ""}, {submission.highlightCount} highlight
                  {submission.highlightCount !== 1 ? "s" : ""}
                </span>
                {!isOwn ? (
                  <span className="actions">
                    <button
                      type="button"
                      disabled={submission.hasUpvoted}
                      onClick={() => onUpvote(submission.submissionId)}
                    >
                      {submission.hasUpvoted ? "Upvoted" : "Upvote"}
                    </button>
                    <button
                      type="button"
                      disabled={submission.hasHighlighted}
                      onClick={() => onHighlight(submission.submissionId)}
                    >
                      {submission.hasHighlighted ? "Highlighted" : "Highlight"}
                    </button>
                  </span>
                ) : null}
              </li>
            );
          })
        ) : (
          <li style={{ opacity: 0.5 }}>No submissions to react to yet.</li>
        )}
      </ul>
    </section>
  );
}
