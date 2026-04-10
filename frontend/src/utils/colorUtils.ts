/** The fixed base color set used in every round. */
export const FIXED_BASE_COLORS: number[][] = [
  [255, 255, 255], // White
  [0, 0, 0],       // Black
  [255, 0, 0],     // Red
  [0, 255, 0],     // Green
  [0, 0, 255],     // Blue
  [0, 255, 255],   // Cyan
  [255, 0, 255],   // Magenta
  [255, 255, 0],   // Yellow
];

export const COLOR_NAMES: Record<string, string> = {
  "255,255,255": "White",
  "0,0,0": "Black",
  "255,0,0": "Red",
  "0,255,0": "Green",
  "0,0,255": "Blue",
  "0,255,255": "Cyan",
  "255,0,255": "Magenta",
  "255,255,0": "Yellow",
};

export function colorName(rgb: number[]): string {
  return COLOR_NAMES[rgb.join(",")] ?? `rgb(${rgb.join(", ")})`;
}

export function textColorFor(rgb: number[]): string {
  const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return luminance > 140 ? "#12212c" : "#f8fbfc";
}

/**
 * Exact decomposition of any RGB target into the 8 RGB-cube base colors.
 * Uses the sorted-channel staircase — always zero blending error.
 * Returns weights (0–1) indexed to match baseColorSet.
 */
export function computeOptimalWeights(
  baseColorSet: number[][],
  targetColor: number[],
): number[] {
  const weights = Array(baseColorSet.length).fill(0);

  const t = targetColor.map((v) => v / 255);
  const channels = [0, 1, 2].sort((a, b) => t[a] - t[b]);
  const [c0, c1, c2] = channels;

  const primary: number[] = [0, 0, 0]; primary[c2] = 255;
  const secondary: number[] = [0, 0, 0]; secondary[c2] = 255; secondary[c1] = 255;

  function indexOf(rgb: number[]) {
    return baseColorSet.findIndex((c) => c[0] === rgb[0] && c[1] === rgb[1] && c[2] === rgb[2]);
  }

  const iBlack     = indexOf([0, 0, 0]);
  const iWhite     = indexOf([255, 255, 255]);
  const iPrimary   = indexOf(primary);
  const iSecondary = indexOf(secondary);

  if (iBlack     >= 0) weights[iBlack]     = 1 - t[c2];
  if (iPrimary   >= 0) weights[iPrimary]   = t[c2] - t[c1];
  if (iSecondary >= 0) weights[iSecondary] = t[c1] - t[c0];
  if (iWhite     >= 0) weights[iWhite]     = t[c0];

  return weights;
}

/** Blend colors using the same weighted-average logic as the backend. */
export function blendColors(baseColorSet: number[][], weights: number[]): number[] {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total === 0) return [0, 0, 0];
  return [0, 1, 2].map((c) =>
    Math.round(
      baseColorSet.reduce((sum, color, i) => sum + color[c] * (weights[i] ?? 0), 0) / total,
    ),
  );
}
