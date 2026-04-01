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
        : "None";

  return (
    <section className="status-card">
      <p className="eyebrow">Entry Flow</p>
      <h2>Player Identity and Session</h2>
      <p aria-live="polite">Session load state: {loadState}</p>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      {session ? (
        <>
          <p>Signed in as: {session.player.displayName}</p>
          <label>
            Guest display name
            <input
              value={draftDisplayName}
              onChange={(event) => onDraftDisplayNameChange(event.target.value)}
            />
          </label>
          <div className="actions">
            <button type="button" onClick={onRenameGuest}>
              Save display name
            </button>
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
          <div className="mode-group">
            <p>Choose a mode for handoff:</p>
            <button type="button" onClick={() => onSelectMode("single_player")}>
              Single Player
            </button>
            <button type="button" onClick={() => onSelectMode("multiplayer")}>
              Multiplayer
            </button>
          </div>
          <p>Selected mode: {modeLabel}</p>
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
