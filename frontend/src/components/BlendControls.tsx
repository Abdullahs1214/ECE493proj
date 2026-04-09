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
  const totalWeight = mixWeights.reduce((sum, weight) => sum + weight, 0);

  function updateWeight(index: number, value: number) {
    const nextWeights = [...mixWeights];
    nextWeights[index] = Math.max(0, Math.min(100, value));
    onMixWeightsChange(nextWeights);
  }

  return (
    <section className="status-card">
      <p className="eyebrow">Blend</p>
      <h2>Blend Your Color</h2>
      <p>Mix the source colors to match the target as closely as possible.</p>

      {baseColorSet.map((sourceColor, index) => (
        <div key={`${sourceColor.join("-")}-${index}`}>
          <label>
            Source color {index + 1}: {mixWeights[index]}%
          </label>
          <div className="slider-row">
            <button type="button" onClick={() => updateWeight(index, mixWeights[index] - 5)}>
              -
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={mixWeights[index]}
              onChange={(event) => updateWeight(index, Number(event.target.value))}
            />
            <button type="button" onClick={() => updateWeight(index, mixWeights[index] + 5)}>
              +
            </button>
          </div>
          <div
            className="color-preview color-preview--compact"
            style={{
              backgroundColor: `rgb(${sourceColor[0]}, ${sourceColor[1]}, ${sourceColor[2]})`,
            }}
          />
        </div>
      ))}

      <p>
        Total mix weight: {totalWeight}% | Blended result: rgb({blendedColor.join(", ")})
      </p>

      <div
        className="color-preview"
        style={{
          backgroundColor: `rgb(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]})`,
        }}
      />

      <div className="actions">
        <button type="button" onClick={onReset}>
          Reset blend
        </button>
        <button type="button" onClick={onSubmit} disabled={disabled}>
          {disabled ? "Submitting..." : "Submit color"}
        </button>
      </div>
    </section>
  );
}
