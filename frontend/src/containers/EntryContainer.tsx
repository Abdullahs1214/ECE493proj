import { useEffect, useState } from "react";

import BlendGameContainer from "./BlendGameContainer";
import EntryPanel from "../components/EntryPanel";
import HistoryContainer from "./HistoryContainer";
import LobbyContainer from "./LobbyContainer";
import { useModeSelection } from "../hooks/useModeSelection";
import { useSessionState } from "../hooks/useSessionState";

export default function EntryContainer() {
  const { session, loadState, errorMessage, registerLocal, loginLocal, enterAsGuest, enterWithOAuth, renameGuest, updateAvatar, clearSession } =
    useSessionState();
  const { mode, selectMode, resetMode } = useModeSelection();
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState("");

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
    setDraftDisplayName("");
  }

  async function handleUpdateAvatar() {
    await updateAvatar(draftAvatarUrl.trim());
    setDraftAvatarUrl("");
  }

  async function handleClearAvatar() {
    await updateAvatar("");
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
          draftAvatarUrl={draftAvatarUrl}
          onDraftDisplayNameChange={setDraftDisplayName}
          onDraftAvatarUrlChange={setDraftAvatarUrl}
          onGuestEntry={handleGuestEntry}
          onOAuthEntry={handleOAuthEntry}
          onRegister={registerLocal}
          onLogin={loginLocal}
          onRenameGuest={handleRenameGuest}
          onUpdateAvatar={handleUpdateAvatar}
          onClearAvatar={handleClearAvatar}
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
