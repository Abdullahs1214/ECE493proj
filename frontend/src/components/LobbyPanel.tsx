import { useState } from "react";

import RoomForm from "./RoomForm";
import type { Room, Session } from "../types/game";

function shortCode(roomId: string): string {
  return roomId.split("-")[0].toUpperCase();
}

function activeCount(room: Room): number {
  return room.members.filter((m) => m.membershipStatus === "active").length;
}

interface LobbyPanelProps {
  session: Session;
  room: Room | null;
  availableRooms: Room[];
  currentPlayerId: string;
  roomIdInput: string;
  errorMessage: string | null;
  onRoomIdInputChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onJoinRoomById: (roomId: string) => void;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  onStartGameplay: () => void;
  isStarting?: boolean;
}

export default function LobbyPanel({
  session,
  room,
  availableRooms,
  currentPlayerId,
  roomIdInput,
  errorMessage,
  onRoomIdInputChange,
  onCreateRoom,
  onJoinRoom,
  onJoinRoomById,
  onLeaveRoom,
  onDeleteRoom,
  onStartGameplay,
  isStarting = false,
}: LobbyPanelProps) {
  const isHost = room?.hostPlayerId === currentPlayerId;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!room) return;
    navigator.clipboard.writeText(room.roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="status-card">
      <p className="eyebrow">Lobby</p>
      <h2>Multiplayer Room</h2>
      <p>Playing as: {session.player.displayName}</p>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      {room ? (
        <>
          <div className="room-code-row">
            <div>
              <p className="room-code">{shortCode(room.roomId)}</p>
              <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.5 }}>Room code</p>
            </div>
            <button type="button" className="copy-btn" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy full ID"}
            </button>
          </div>

          <p style={{ marginTop: "8px" }}>
            Host: <strong>{room.hostDisplayName}</strong>
            {isHost ? " (you)" : ""}
            {" · "}Status: {room.roomStatus}
          </p>

          <ul className="member-list">
            {room.members.map((member) => (
              <li key={member.roomMembershipId}>
                {member.player.displayName}
                {member.player.playerId === room.hostPlayerId ? " 👑" : ""}
                {member.membershipStatus === "waiting_for_next_game" ? " — waiting" : ""}
                {member.membershipStatus === "disconnected" ? " — disconnected" : ""}
              </li>
            ))}
          </ul>

          <div className="actions">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={onStartGameplay}
                  disabled={activeCount(room) < 2 || isStarting}
                  title={activeCount(room) < 2 ? "Need at least 2 active players" : ""}
                >
                  {isStarting ? "Starting..." : "Start game"}
                </button>
                <button type="button" onClick={onDeleteRoom}>
                  Delete room
                </button>
              </>
            ) : null}
            <button type="button" onClick={onLeaveRoom}>
              Leave room
            </button>
          </div>
        </>
      ) : (
        <>
          <RoomForm
            roomIdInput={roomIdInput}
            onRoomIdInputChange={onRoomIdInputChange}
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
          />

          {availableRooms.length > 0 ? (
            <>
              <h3>Active rooms</h3>
              <ul className="room-list">
                {availableRooms.map((r) => (
                  <li key={r.roomId} className="room-list-item">
                    <div className="room-list-info">
                      <span className="room-list-code">{shortCode(r.roomId)}</span>
                      <span className="room-list-meta">
                        Host: {r.hostDisplayName} · {activeCount(r)} player{activeCount(r) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="room-join-btn"
                      onClick={() => onJoinRoomById(r.roomId)}
                    >
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ opacity: 0.5, marginTop: "16px" }}>No active rooms. Create one!</p>
          )}
        </>
      )}
    </section>
  );
}
