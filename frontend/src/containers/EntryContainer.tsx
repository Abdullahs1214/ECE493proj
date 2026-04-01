import { useEffect, useState } from "react";

import EntryPanel from "../components/EntryPanel";
import { useModeSelection } from "../hooks/useModeSelection";
import { useSessionState } from "../hooks/useSessionState";


export default function EntryContainer() {
  const { session, loadState, errorMessage, enterAsGuest, renameGuest, clearSession } =
    useSessionState();
  const { mode, selectMode, resetMode } = useModeSelection();
  const [draftDisplayName, setDraftDisplayName] = useState("");

  useEffect(() => {
    setDraftDisplayName(session?.player.displayName ?? "");
  }, [session]);

  async function handleGuestEntry() {
    await enterAsGuest();
  }

  async function handleRenameGuest() {
    if (!draftDisplayName.trim()) {
      return;
    }
    await renameGuest(draftDisplayName);
  }

  async function handleLogout() {
    await clearSession();
    resetMode();
  }

  return (
    <EntryPanel
      session={session}
      loadState={loadState}
      errorMessage={errorMessage}
      selectedMode={mode}
      draftDisplayName={draftDisplayName}
      onDraftDisplayNameChange={setDraftDisplayName}
      onGuestEntry={handleGuestEntry}
      onRenameGuest={handleRenameGuest}
      onLogout={handleLogout}
      onSelectMode={selectMode}
    />
  );
}
