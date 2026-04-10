import { useState } from "react";

import type { GameplayResult, GameplayRound, SocialInteractionState } from "../types/game";
import BlendSimulator from "./BlendSimulator";
import { computeOptimalWeights } from "../utils/colorUtils";

interface ResultsPanelProps {
  round: GameplayRound;
  results: GameplayResult[];
  social?: SocialInteractionState;
}

export default function ResultsPanel({ round, results, social }: ResultsPanelProps) {
  const [showSimulator, setShowSimulator] = useState(false);
  const optimalWeights = computeOptimalWeights(round.baseColorSet, round.targetColor);

  const winners = results.filter((result) => result.rank === 1);
  const winner = winners[0] ?? null;

  const scores = results.map((r) => r.score);
  const hasTie = scores.length > 1 && new Set(scores).size < scores.length;
  const hasSharedFirstPlace = winners.length > 1;

  function closenessLabel(similarityPercentage: number) {
    if (similarityPercentage >= 95) return "Excellent match";
    if (similarityPercentage >= 80) return "Close match";
    return "Room to improve";
  }

  return (
    <section className="status-card">
      <p className="eyebrow">Results</p>
      <h2>Round Results</h2>
      <p>Round {round.roundNumber}</p>
      <p>Target color: rgb({round.targetColor.join(", ")})</p>

      <div
        className="color-preview"
        style={{
          backgroundColor: `rgb(${round.targetColor[0]}, ${round.targetColor[1]}, ${round.targetColor[2]})`,
        }}
      />

      {/* Optimal blend hint */}
      <div style={{ margin: "12px 0 4px" }}>
        <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "0.9rem" }}>Optimal blend to reach target:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
          {round.baseColorSet.map((color, i) => {
            const pct = Math.round(optimalWeights[i] * 100);
            if (pct === 0) return null;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "36px",
                    height: "36px",
                    borderRadius: "6px",
                    background: `rgb(${color[0]},${color[1]},${color[2]})`,
                    border: "1px solid rgba(0,0,0,0.15)",
                  }}
                  title={`RGB(${color.join(", ")})`}
                />
                <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{pct}%</span>
              </div>
            );
          })}
          <button
            type="button"
            className="history-toggle-btn"
            style={{ fontSize: "0.78rem", alignSelf: "flex-end" }}
            onClick={() => setShowSimulator((v) => !v)}
          >
            {showSimulator ? "Hide simulator" : "Try it →"}
          </button>
        </div>

        {showSimulator ? (
          <BlendSimulator targetColor={round.targetColor} initialWeights={optimalWeights} />
        ) : null}
      </div>

      {winner ? (
        <div className="result-highlight">
          <strong>
            {hasSharedFirstPlace
              ? `Winners (tied): ${winners.map((w) => w.displayName).join(", ")}`
              : `Winner: ${winner.displayName}`}
          </strong>
          <p>
            {winner.score} points with a {winner.similarityPercentage}% match.
          </p>
        </div>
      ) : null}

      {hasTie ? <p>Tie-break rule: exact unrounded color distance to the target.</p> : null}

      {social?.crowdFavorites && social.crowdFavorites.length > 0 ? (
        <p>
          Crowd favorite{social.crowdFavorites.length > 1 ? "s (tied)" : ""}:{" "}
          {social.crowdFavorites.map((f) => f.displayName).join(", ")}
        </p>
      ) : null}

      <ul className="member-list">
        {results.map((result) => {
          const isWinner = result.rank === 1;
          const color = result.blendedColor
            ? `rgb(${result.blendedColor[0]}, ${result.blendedColor[1]}, ${result.blendedColor[2]})`
            : null;

          return (
            <li key={result.playerId} className={isWinner ? "result-row result-row--winner" : "result-row"}>
              <p style={{ fontWeight: isWinner ? 700 : 400 }}>
                #{result.rank} {result.displayName}
                {isWinner ? (hasSharedFirstPlace ? " — Winner (tied)" : " — Winner") : ""}
              </p>
              <p>
                {result.score} points — {result.similarityPercentage}% match —{" "}
                {closenessLabel(result.similarityPercentage)}
              </p>
              <div className="result-meter" aria-label={`${result.displayName} closeness meter`}>
                <div
                  className="result-meter__fill"
                  style={{ width: `${Math.max(0, Math.min(100, result.similarityPercentage))}%` }}
                />
              </div>
              <p style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                Submitted:{" "}
                {color ? (
                  <>
                    rgb({result.blendedColor!.join(", ")})
                    <span
                      className="result-swatch"
                      style={{ backgroundColor: color }}
                      aria-label={`Submitted color: ${color}`}
                    />
                  </>
                ) : (
                  "No submission"
                )}
              </p>
              <p>Distance from target: {result.colorDistance.toFixed(2)}</p>
              {hasTie ? (
                <p>Tie-break basis: {result.tieBreakBasis.replaceAll("_", " ")}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
