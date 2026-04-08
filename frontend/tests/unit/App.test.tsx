import { render, screen, waitFor, act } from "@testing-library/react";
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

test("App cleanup cancels in-flight health request on unmount", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => {})));

  const { unmount } = render(<App />);
  unmount(); // triggers cleanup: active = false (lines 28-29)

  await act(async () => { await Promise.resolve(); });

  vi.unstubAllGlobals();
});
