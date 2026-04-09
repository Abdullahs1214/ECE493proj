const COLOR_NAMES: Record<string, string> = {
  "255,255,255": "White",
  "0,0,0": "Black",
  "255,0,0": "Red",
  "0,255,0": "Green",
  "0,0,255": "Blue",
  "0,255,255": "Cyan",
  "255,0,255": "Magenta",
  "255,255,0": "Yellow",
};

function colorName(rgb: number[]) {
  return COLOR_NAMES[rgb.join(",")] ?? `rgb(${rgb.join(", ")})`;
}

function textColorFor(rgb: number[]) {
  // luminance-based contrast: dark text on light colors, light on dark
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return luminance > 140 ? "#12212c" : "#f8fbfc";
}

interface BlendControlsProps {
  baseColorSet: number[][];
  mixWeights: number[];
  blendedColor: number[];
  onMixWeightsChange: (nextWeights: number[]) => void;
  onReset: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function BlendControls({
  baseColorSet,
  mixWeights,
  blendedColor,
  onMixWeightsChange,
  onReset,
  onSubmit,
  disabled = false,
}: BlendControlsProps) {
  function updateWeight(index: number, delta: number) {
    const nextWeights = [...mixWeights];
    nextWeights[index] = Math.max(0, Math.min(100, (nextWeights[index] ?? 0) + delta));
    onMixWeightsChange(nextWeights);
  }

  function setWeight(index: number, value: number) {
    const nextWeights = [...mixWeights];
    nextWeights[index] = Math.max(0, Math.min(100, value));
    onMixWeightsChange(nextWeights);
  }

  const totalWeight = mixWeights.reduce((sum, w) => sum + w, 0);

  return (
    <section className="status-card">
      <p className="eyebrow">Blend</p>
      <h2>Mix Your Color</h2>
      <p>Click a color tile to add it, or use the +/− buttons for fine control.</p>

      {/* Blended preview */}
      <div
        className="color-preview"
        style={{
          backgroundColor: `rgb(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]})`,
        }}
        aria-label={`Current blend: rgb(${blendedColor.join(", ")})`}
      />
      <p style={{ textAlign: "center", marginTop: "6px", fontSize: "0.9rem" }}>
        Your blend: rgb({blendedColor.join(", ")})
        {totalWeight === 0 ? " — add some color below" : ""}
      </p>

      {/* Color palette grid */}
      <div className="palette-grid">
        {baseColorSet.map((sourceColor, index) => {
          const weight = mixWeights[index] ?? 0;
          const bg = `rgb(${sourceColor[0]}, ${sourceColor[1]}, ${sourceColor[2]})`;
          const fg = textColorFor(sourceColor);
          const name = colorName(sourceColor);
          const isBlack = sourceColor[0] === 0 && sourceColor[1] === 0 && sourceColor[2] === 0;

          return (
            <div
              key={`${sourceColor.join("-")}-${index}`}
              className={`palette-tile${weight > 0 ? " palette-tile--active" : ""}`}
              style={{
                backgroundColor: bg,
                color: fg,
                border: isBlack ? "2px solid rgba(18,33,44,0.25)" : "2px solid transparent",
              }}
            >
              {/* Click the swatch body to +10 */}
              <button
                type="button"
                className="palette-tile__face"
                style={{ color: fg }}
                onClick={() => updateWeight(index, 10)}
                aria-label={`Add ${name}`}
              >
                <span className="palette-tile__name">{name}</span>
                <span className="palette-tile__weight">{weight}%</span>
              </button>

              {/* Fine controls */}
              <div className="palette-tile__controls">
                <button
                  type="button"
                  className="palette-ctrl-btn"
                  style={{ color: fg }}
                  onClick={() => updateWeight(index, -10)}
                  aria-label={`Remove ${name}`}
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={(e) => setWeight(index, Number(e.target.value))}
                  className="palette-tile__input"
                  style={{ color: fg, borderColor: `${fg}44` }}
                  aria-label={`${name} weight`}
                />
                <button
                  type="button"
                  className="palette-ctrl-btn"
                  style={{ color: fg }}
                  onClick={() => updateWeight(index, 10)}
                  aria-label={`Add more ${name}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="actions" style={{ marginTop: "16px" }}>
        <button type="button" onClick={onReset}>
          Reset
        </button>
        <button type="button" onClick={onSubmit} disabled={disabled || totalWeight === 0}>
          {disabled ? "Submitting..." : "Submit color"}
        </button>
      </div>
    </section>
  );
}
