import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const gameplayHookMock = vi.hoisted(() => ({
  useGameplayState: vi.fn(),
}));

const childProps = vi.hoisted(() => ({
  controls: null as any,
}));

vi.mock("../../src/hooks/useGameplayState", () => gameplayHookMock);
vi.mock("../../src/components/BlendControls", () => ({
  default: (props: any) => {
    childProps.controls = props;
    return <div>Mock Controls</div>;
  },
}));
vi.mock("../../src/containers/ResultsContainer", () => ({
  default: () => <div>Mock Results</div>,
}));

import BlendGameContainer from "../../src/containers/BlendGameContainer";

test("BlendGameContainer covers reset, back-to-menu, and guarded submit branches", async () => {
  const submitColor = vi.fn().mockResolvedValue(undefined);
  const setGameplay = vi.fn();
  const onBackToMenu = vi.fn();

  gameplayHookMock.useGameplayState.mockReturnValue({
    gameplay: {
      matchId: "match-1",
      mode: "single_player",
      matchStatus: "active_round",
      currentRoundNumber: 1,
      totalRounds: 3,
      canAdvance: true,
      matchLeaderboard: null,
      round: {
        roundId: "round-1",
        roundNumber: 1,
        roundStatus: "active_blending",
        targetColor: [255, 0, 0],
        baseColorSet: [[255, 0, 0], [0, 255, 0]],
        timeLimit: 60,
        remainingSeconds: 30,
      },
      submissions: [],
      results: [],
    },
    setGameplay,
    errorMessage: null,
    isLoading: false,
    submitColor,
  });

  const view = render(<BlendGameContainer mode="single_player" currentPlayerId="player-2" onBackToMenu={onBackToMenu} />);

  expect(screen.getByText("Mock Controls")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Back to menu" }));
  expect(onBackToMenu).toHaveBeenCalled();

  act(() => {
    childProps.controls.onMixWeightsChange([10, 20]);
  });
  await act(async () => {
    await childProps.controls.onSubmit();
  });
  act(() => {
    childProps.controls.onReset();
  });

  expect(submitColor).toHaveBeenCalledWith([10, 20]);
  cleanup();

  gameplayHookMock.useGameplayState.mockReturnValue({
    gameplay: {
      matchId: "match-1",
      mode: "multiplayer",
      matchStatus: "active_round",
      currentRoundNumber: 1,
      totalRounds: 3,
      canAdvance: true,
      matchLeaderboard: null,
      round: {
        roundId: "round-1",
        roundNumber: 1,
        roundStatus: "active_blending",
        targetColor: [255, 0, 0],
        baseColorSet: [[255, 0, 0], [0, 255, 0]],
        timeLimit: 60,
        remainingSeconds: 30,
      },
      submissions: [
        { playerId: "player-1", displayName: "You", submissionStatus: "submitted" },
      ],
      results: [],
    },
    setGameplay,
    errorMessage: null,
    isLoading: false,
    submitColor,
  });

  const multiplayerView = render(<BlendGameContainer mode="multiplayer" currentPlayerId="player-1" onBackToMenu={onBackToMenu} />);
  expect(within(multiplayerView.container).getByText("Waiting for other players")).toBeInTheDocument();
  expect(within(multiplayerView.container).queryByText("Mock Controls")).not.toBeInTheDocument();
});
