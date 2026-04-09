import { useRef, useState } from "react";

import type { GameMode, Session } from "../types/game";

function resizeToDataUrl(file: File, maxSize = 96): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface EntryPanelProps {
  session: Session | null;
  loadState: "idle" | "loading" | "ready" | "error";
  errorMessage: string | null;
  selectedMode: GameMode | null;
  draftDisplayName: string;
  draftAvatarUrl: string;
  onDraftDisplayNameChange: (value: string) => void;
  onDraftAvatarUrlChange: (value: string) => void;
  onGuestEntry: () => void;
  onOAuthEntry: (provider: "google" | "github") => void;
  onRenameGuest: () => void;
  onUpdateAvatar: () => void;
  onClearAvatar: () => void;
  onLogout: () => void;
  onSelectMode: (mode: GameMode) => void;
}

export default function EntryPanel({
  session,
  loadState,
  errorMessage,
  selectedMode,
  draftDisplayName,
  draftAvatarUrl,
  onDraftDisplayNameChange,
  onDraftAvatarUrlChange,
  onGuestEntry,
  onOAuthEntry,
  onRenameGuest,
  onUpdateAvatar,
  onClearAvatar,
  onLogout,
  onSelectMode,
}: EntryPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await resizeToDataUrl(file);
    onDraftAvatarUrlChange(dataUrl);
  }

  function handleSaveAvatar() {
    onUpdateAvatar();
    setShowAvatarUpload(false);
    onDraftAvatarUrlChange("");
  }

  function handleCancelAvatar() {
    setShowAvatarUpload(false);
    onDraftAvatarUrlChange("");
  }

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
          {/* Profile row: avatar + name + logout */}
          <div className="profile-row">
            <div
              className="avatar-clickable"
              onClick={() => setShowAvatarUpload((v) => !v)}
              title="Change avatar"
            >
              {session.player.profileAvatar ? (
                <img
                  src={session.player.profileAvatar}
                  alt={`${session.player.displayName}'s avatar`}
                  className="avatar-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {session.player.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{session.player.displayName}</p>
              <p style={{ margin: 0, fontSize: "0.82rem", opacity: 0.5 }}>{session.sessionType}</p>
            </div>

            <button type="button" className="logout-btn" onClick={onLogout}>
              Log out
            </button>
          </div>

          {/* Avatar upload — hidden until avatar is clicked or toggled */}
          {showAvatarUpload ? (
            <>
              <div
                className={`avatar-drop-zone${isDragging ? " avatar-drop-zone--active" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                role="button"
                tabIndex={0}
                aria-label="Upload avatar image"
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              >
                {draftAvatarUrl ? (
                  <img src={draftAvatarUrl} alt="Preview" className="avatar-drop-preview" />
                ) : (
                  <span>{isDragging ? "Drop it!" : "Drop image or click to upload"}</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="actions">
                <button type="button" onClick={handleSaveAvatar} disabled={!draftAvatarUrl}>
                  Save avatar
                </button>
                {session.player.profileAvatar ? (
                  <button type="button" onClick={() => { onClearAvatar(); setShowAvatarUpload(false); }}>
                    Remove avatar
                  </button>
                ) : null}
                <button type="button" className="history-toggle-btn" onClick={handleCancelAvatar}>
                  Cancel
                </button>
              </div>
            </>
          ) : null}

          {/* Display name (guest only) */}
          {session.sessionType === "guest" ? (
            <>
              <label style={{ marginTop: "12px", display: "block" }}>
                Display name
                <input
                  value={draftDisplayName}
                  onChange={(event) => onDraftDisplayNameChange(event.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onRenameGuest()}
                />
              </label>
              <div className="actions">
                <button type="button" onClick={onRenameGuest}>
                  Save name
                </button>
              </div>
            </>
          ) : null}

          {/* Mode selection */}
          <div className="mode-group">
            <p style={{ margin: "16px 0 8px", fontWeight: 600 }}>Choose a mode</p>
            <button type="button" onClick={() => onSelectMode("single_player")}>
              Single Player
            </button>
            <button type="button" onClick={() => onSelectMode("multiplayer")}>
              Multiplayer
            </button>
          </div>

          {modeLabel ? <p style={{ marginTop: "8px", opacity: 0.6, fontSize: "0.85rem" }}>Selected: {modeLabel}</p> : null}
        </>
      ) : (
        <>
          <p style={{ opacity: 0.6 }}>Sign in to save your scores, or jump in as a guest.</p>
          <div className="actions">
            <button type="button" onClick={onGuestEntry}>
              Continue as guest
            </button>
            <button type="button" onClick={() => onOAuthEntry("google")}>
              Sign in with Google
            </button>
            <button type="button" onClick={() => onOAuthEntry("github")}>
              Sign in with GitHub
            </button>
          </div>
        </>
      )}
    </section>
  );
}
