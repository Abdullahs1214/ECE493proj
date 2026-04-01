import { render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import App from "../../src/App";

test("renders health check success state", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    }),
  );

  render(<App />);

  expect(screen.getByText("Foundation Scaffold")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("Backend status: ok")).toBeInTheDocument();
  });

  vi.unstubAllGlobals();
});
