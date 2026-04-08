import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./tests/unit/setupTests.ts",
    coverage: {
      exclude: [
        "vite.config.ts",
        "src/vite-env.d.ts",
        "src/types/game.ts",
      ],
    },
  },
});
