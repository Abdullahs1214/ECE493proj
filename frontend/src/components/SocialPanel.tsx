import type { SocialInteractionState } from "../types/game";

interface SocialPanelProps {
  social: SocialInteractionState;
  onPresetMessage: (message: string) => void;
  onUpvote: (submissionId: string) => void;
  onHighlight: (submissionId: string) => void;
}


export default function SocialPanel({
  social,
  onPresetMessage,
  onUpvote,
  onHighlight,
}: SocialPanelProps) {
  return (
    <section className="status-card">
      <p className="eyebrow">Social</p>
      <h2>Social Interaction</h2>
      {social.crowdFavorite ? (
        <p>
          Crowd favorite: {social.crowdFavorite.displayName} with{" "}
          {social.crowdFavorite.reactionCount} reactions
        </p>
      ) : (
        <p>Crowd favorite: none yet</p>
      )}
      <div className="actions" aria-label="Preset messages">
        {social.presetMessages.map((message) => (
          <button type="button" key={message} onClick={() => onPresetMessage(message)}>
            {message}
          </button>
        ))}
      </div>
      <h3>Submission Reactions</h3>
      <ul className="member-list">
        {social.submissionSummaries.length ? social.submissionSummaries.map((submission) => (
          <li key={submission.submissionId} className="social-submission-row">
            <span>
              {submission.displayName}: {submission.upvoteCount} upvotes,{" "}
              {submission.highlightCount} highlights
            </span>
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
          </li>
        )) : <li>No scored submissions available yet.</li>}
      </ul>
      <h3>Activity</h3>
      <ul className="member-list">
        {social.interactions.length ? social.interactions.map((interaction) => (
          <li key={interaction.socialInteractionId}>
            {interaction.displayName} - {interaction.interactionType}
            {interaction.targetDisplayName ? ` for ${interaction.targetDisplayName}` : ""}
            {interaction.presetMessage ? ` - ${interaction.presetMessage}` : ""}
          </li>
        )) : <li>No social activity yet.</li>}
      </ul>
    </section>
  );
}
