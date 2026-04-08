interface BlendControlsProps {
  blendedColor: number[];
  onBlendedColorChange: (nextColor: number[]) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function BlendControls({
  blendedColor,
  onBlendedColorChange,
  onSubmit,
  disabled = false,
}: BlendControlsProps) {
  function updateChannel(index: number, value: number) {
    const nextColor = [...blendedColor];
    nextColor[index] = Math.max(0, Math.min(255, value));
    onBlendedColorChange(nextColor);
  }

  return (
    <section className="status-card">
      <p className="eyebrow">Blend</p>
      <h2>Blend Your Color</h2>

      {["Red", "Green", "Blue"].map((label, index) => (
        <div key={label}>
          <label>
            {label}: {blendedColor[index]}
          </label>
          <div className="slider-row">
            <button type="button" onClick={() => updateChannel(index, blendedColor[index] - 1)}>
              -
            </button>
            <input
              type="range"
              min="0"
              max="255"
              value={blendedColor[index]}
              onChange={(event) => updateChannel(index, Number(event.target.value))}
            />
            <button type="button" onClick={() => updateChannel(index, blendedColor[index] + 1)}>
              +
            </button>
          </div>
        </div>
      ))}

      <div
        className="color-preview"
        style={{
          backgroundColor: `rgb(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]})`,
        }}
      />

      <div className="actions">
        <button type="button" onClick={onSubmit} disabled={disabled}>
        {disabled ? "Submitted" : "Submit color"}
        </button>
      </div>
    </section>
  );
}