import { render, screen, waitFor, act } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import App from "../../src/App";

test("renders the entry screen", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ error: "No active session." }),
    }),
  );

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });
  // Default tab is "login"; switch to guest tab to see "Continue as guest"
  const { fireEvent } = await import("@testing-library/react");
  fireEvent.click(screen.getByRole("button", { name: "Guest" }));
  expect(screen.getByText("Continue as guest")).toBeInTheDocument();

  vi.unstubAllGlobals();
});

test("App cleanup handles in-flight session request on unmount", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => {})));

  const { unmount } = render(<App />);
  unmount(); // triggers cleanup: active = false (lines 28-29)

  await act(async () => { await Promise.resolve(); });

  vi.unstubAllGlobals();
});
