interface BlendControlsProps {
  blendedColor: number[];
  onBlendedColorChange: (nextColor: number[]) => void;
  onSubmit: () => void;
}


export default function BlendControls({
  blendedColor,
  onBlendedColorChange,
  onSubmit,
}: BlendControlsProps) {
  function updateChannel(index: number, value: number) {
    const nextColor = [...blendedColor];
    nextColor[index] = value;
    onBlendedColorChange(nextColor);
  }

  return (
    <section className="status-card">
      <p className="eyebrow">Blend</p>
      <h2>Blend Your Color</h2>
      {["Red", "Green", "Blue"].map((label, index) => (
        <label key={label}>
          {label}: {blendedColor[index]}
          <input
            type="range"
            min="0"
            max="255"
            value={blendedColor[index]}
            onChange={(event) => updateChannel(index, Number(event.target.value))}
          />
        </label>
      ))}
      <div
        className="color-preview"
        style={{
          backgroundColor: `rgb(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]})`,
        }}
      />
      <div className="actions">
        <button type="button" onClick={onSubmit}>
          Submit color
        </button>
      </div>
    </section>
  );
}
