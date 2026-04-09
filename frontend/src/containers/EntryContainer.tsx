import { useEffect, useState } from "react";

import BlendGameContainer from "./BlendGameContainer";
import EntryPanel from "../components/EntryPanel";
import HistoryContainer from "./HistoryContainer";
import LobbyContainer from "./LobbyContainer";
import { useModeSelection } from "../hooks/useModeSelection";
import { useSessionState } from "../hooks/useSessionState";

export default function EntryContainer() {
  const { session, loadState, errorMessage, enterAsGuest, enterWithOAuth, renameGuest, clearSession } =
    useSessionState();
  const { mode, selectMode, resetMode } = useModeSelection();
  const [draftDisplayName, setDraftDisplayName] = useState("");

  useEffect(() => {
    function handleRestart() {
      if (session) {
        selectMode("single_player");
      }
    }

    window.addEventListener("restart-game", handleRestart);

    return () => {
      window.removeEventListener("restart-game", handleRestart);
    };
  }, [session, selectMode]);

  async function handleGuestEntry() {
    await enterAsGuest();
  }

  async function handleOAuthEntry(provider: "google" | "github") {
    await enterWithOAuth(provider);
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

  function handleBackToMenu() {
    resetMode();
  }

  if (!session || !mode) {
    return (
      <>
        <EntryPanel
          session={session}
          loadState={loadState}
          errorMessage={errorMessage}
          selectedMode={mode}
          draftDisplayName={draftDisplayName}
          onDraftDisplayNameChange={setDraftDisplayName}
          onGuestEntry={handleGuestEntry}
          onOAuthEntry={handleOAuthEntry}
          onRenameGuest={handleRenameGuest}
          onLogout={handleLogout}
          onSelectMode={selectMode}
        />
        {session ? <HistoryContainer session={session} /> : null}
      </>
    );
  }

  if (mode === "single_player") {
    return (
      <BlendGameContainer
        mode="single_player"
        currentPlayerId={session.player.playerId}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  return (
    <LobbyContainer
      session={session}
      onBackToMenu={handleBackToMenu}
      currentPlayerId={session.player.playerId}
    />
  );
}
