import type { GameMode, Session } from "../types/game";

interface EntryPanelProps {
  session: Session | null;
  loadState: "idle" | "loading" | "ready" | "error";
  errorMessage: string | null;
  selectedMode: GameMode | null;
  draftDisplayName: string;
  onDraftDisplayNameChange: (value: string) => void;
  onGuestEntry: () => void;
  onRenameGuest: () => void;
  onLogout: () => void;
  onSelectMode: (mode: GameMode) => void;
}

export default function EntryPanel({
  session,
  loadState,
  errorMessage,
  selectedMode,
  draftDisplayName,
  onDraftDisplayNameChange,
  onGuestEntry,
  onRenameGuest,
  onLogout,
  onSelectMode,
}: EntryPanelProps) {
  const modeLabel =
    selectedMode === "single_player"
      ? "Single Player"
      : selectedMode === "multiplayer"
        ? "Multiplayer"
        : null;

  return (
    <section className="status-card">
      <p className="eyebrow">Blend Colour Game</p>
      <h2>Welcome</h2>

      {loadState === "loading" ? <p>Loading session...</p> : null}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      {session ? (
        <>
          <p>Playing as: {session.player.displayName}</p>

          <label>
            Display name
            <input
              value={draftDisplayName}
              onChange={(event) => onDraftDisplayNameChange(event.target.value)}
            />
          </label>

          <div className="actions">
            <button type="button" onClick={onRenameGuest}>
              Save name
            </button>
            <button type="button" onClick={onLogout}>
              Log out
            </button>
          </div>

          <div className="mode-group">
            <p>Choose a mode:</p>
            <button type="button" onClick={() => onSelectMode("single_player")}>
              Single Player
            </button>
            <button type="button" onClick={() => onSelectMode("multiplayer")}>
              Multiplayer
            </button>
          </div>

          {modeLabel ? <p>Selected mode: {modeLabel}</p> : null}
        </>
      ) : (
        <div className="actions">
          <button type="button" onClick={onGuestEntry}>
            Continue as guest
          </button>
        </div>
      )}
    </section>
  );
}