import { useState } from "react";

import type { GameMode } from "../types/game";


export function useModeSelection() {
  const [mode, setMode] = useState<GameMode | null>(null);

  return {
    mode,
    selectMode: setMode,
    resetMode: () => setMode(null),
  };
}
