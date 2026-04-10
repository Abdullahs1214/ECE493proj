import { useState } from "react";

import { blendColors, colorName, computeOptimalWeights, FIXED_BASE_COLORS, textColorFor } from "../utils/colorUtils";

interface BlendSimulatorProps {
  targetColor: number[];
  /** Optional initial weights (0–1 each). Defaults to optimal. */
  initialWeights?: number[];
}

export default function BlendSimulator({ targetColor, initialWeights }: BlendSimulatorProps) {
  const optimalWeights = computeOptimalWeights(FIXED_BASE_COLORS, targetColor);
  const startWeights = initialWeights ?? optimalWeights;

  // Weights stored as 0–100 integers (matching BlendControls convention)
  const [mixWeights, setMixWeights] = useState<number[]>(
    startWeights.map((w) => Math.round(w * 100)),
  );

  const blended = blendColors(FIXED_BASE_COLORS, mixWeights);
  const targetRgb = `rgb(${targetColor.join(", ")})`;
  const blendedRgb = `rgb(${blended.join(", ")})`;

  function updateWeight(index: number, delta: number) {
    setMixWeights((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, Math.min(100, (next[index] ?? 0) + delta));
      return next;
    });
  }

  function setWeight(index: number, value: number) {
    setMixWeights((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, Math.min(100, value));
      return next;
    });
  }

  function loadOptimal() {
    setMixWeights(optimalWeights.map((w) => Math.round(w * 100)));
  }

  function reset() {
    setMixWeights(Array(FIXED_BASE_COLORS.length).fill(0));
  }

  const totalWeight = mixWeights.reduce((s, w) => s + w, 0);

  return (
    <div style={{ marginTop: "12px" }}>
      {/* Target vs current blend side-by-side */}
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1 }}>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600 }}>Target</span>
          <div
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "8px",
              background: targetRgb,
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          />
          <span style={{ fontSize: "0.7rem", opacity: 0.55 }}>rgb({targetColor.join(", ")})</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1 }}>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, fontWeight: 600 }}>Your mix</span>
          <div
            style={{
              width: "100%",
              height: "52px",
              borderRadius: "8px",
              background: totalWeight === 0 ? "transparent" : blendedRgb,
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          />
          <span style={{ fontSize: "0.7rem", opacity: 0.55 }}>
            {totalWeight === 0 ? "—" : `rgb(${blended.join(", ")})`}
          </span>
        </div>
      </div>

      {/* Color tiles */}
      <div className="palette-grid" style={{ gap: "6px" }}>
        {FIXED_BASE_COLORS.map((color, i) => {
          const weight = mixWeights[i] ?? 0;
          const bg = `rgb(${color.join(", ")})`;
          const fg = textColorFor(color);
          const isBlack = color[0] === 0 && color[1] === 0 && color[2] === 0;

          return (
            <div
              key={color.join("-")}
              className={`palette-tile${weight > 0 ? " palette-tile--active" : ""}`}
              style={{
                backgroundColor: bg,
                color: fg,
                border: isBlack ? "2px solid rgba(18,33,44,0.25)" : "2px solid transparent",
              }}
            >
              <button
                type="button"
                className="palette-tile__face"
                style={{ color: fg }}
                onClick={() => updateWeight(i, 10)}
                aria-label={`Add ${colorName(color)}`}
              >
                <span className="palette-tile__name">{colorName(color)}</span>
                <span className="palette-tile__weight">{weight}%</span>
              </button>
              <div className="palette-tile__controls">
                <button
                  type="button"
                  className="palette-ctrl-btn"
                  style={{ color: fg }}
                  onClick={() => updateWeight(i, -10)}
                  aria-label={`Remove ${colorName(color)}`}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={(e) => setWeight(i, Number(e.target.value))}
                  className="palette-tile__input"
                  style={{ color: fg, borderColor: `${fg}44` }}
                  aria-label={`${colorName(color)} weight`}
                />
                <button
                  type="button"
                  className="palette-ctrl-btn"
                  style={{ color: fg }}
                  onClick={() => updateWeight(i, 10)}
                  aria-label={`Add more ${colorName(color)}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="actions" style={{ marginTop: "10px" }}>
        <button type="button" onClick={loadOptimal}>
          Load optimal
        </button>
        <button type="button" className="history-toggle-btn" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
