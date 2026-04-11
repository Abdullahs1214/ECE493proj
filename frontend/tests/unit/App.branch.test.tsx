import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const ambientMock = vi.hoisted(() => ({
  useAmbientMusic: vi.fn(),
}));

vi.mock("../../src/hooks/useAmbientMusic", () => ambientMock);
vi.mock("../../src/containers/EntryContainer", () => ({
  default: () => <div>Mock Entry</div>,
}));

import App from "../../src/App";

afterEach(() => {
  ambientMock.useAmbientMusic.mockReset();
});

test("App covers playing and muted button branches", () => {
  const toggle = vi.fn();

  ambientMock.useAmbientMusic.mockReturnValueOnce({ playing: false, toggle });
  const view = render(<App />);
  expect(screen.getByRole("button", { name: "Play music" })).toHaveTextContent("🔇");
  fireEvent.click(screen.getByRole("button", { name: "Play music" }));
  expect(toggle).toHaveBeenCalled();

  view.unmount();

  ambientMock.useAmbientMusic.mockReturnValueOnce({ playing: true, toggle });
  render(<App />);
  expect(screen.getByRole("button", { name: "Mute music" })).toHaveTextContent("🔊");
});
