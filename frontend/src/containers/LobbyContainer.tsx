import { useState } from "react";

import BlendGameContainer from "./BlendGameContainer";
import LobbyPanel from "../components/LobbyPanel";
import { useRoomState } from "../hooks/useRoomState";
import { startGameplay } from "../services/apiClient";
import type { Session } from "../types/game";

interface LobbyContainerProps {
  session: Session;
  onBackToMenu?: () => void;
  currentPlayerId: string;
}

export default function LobbyContainer({
  session,
  onBackToMenu,
  currentPlayerId,
}: LobbyContainerProps) {
  const {
    room,
    availableRooms,
    activeMatchId,
    errorMessage,
    setErrorMessage,
    setActiveMatchId,
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
  } = useRoomState();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function handleCreateRoom() {
    try {
      await createRoom();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create room.");
    }
  }

  async function handleJoinRoom() {
    if (!roomIdInput.trim()) {
      setErrorMessage("roomId is required.");
      return;
    }

    try {
      await joinRoom(roomIdInput.trim());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to join room.");
    }
  }

  async function handleLeaveRoom() {
    try {
      await leaveRoom();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to leave room.");
    }
  }

  async function handleStartGameplay() {
    if (!room || isStarting) {
      return;
    }
    if (room.members.filter((member) => member.membershipStatus === "active").length < 2) {
      setErrorMessage("At least two active players are required to start gameplay.");
      return;
    }
    setIsStarting(true);
    try {
      const gameplay = await startGameplay("multiplayer", room.roomId);
      setActiveMatchId(gameplay.matchId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start gameplay.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleDeleteRoom() {
    try {
      await deleteRoom();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete room.");
    }
  }

  if (room && activeMatchId) {
    return (
      <BlendGameContainer
        mode="multiplayer"
        roomId={room.roomId}
        initialMatchId={activeMatchId}
        currentPlayerId={currentPlayerId}
        hostPlayerId={room.hostPlayerId}
        onBackToLobby={() => setActiveMatchId(null)}
        onBackToMenu={onBackToMenu}
      />
    );
  }

  return (
    <>
      {onBackToMenu ? (
        <div className="status-card">
          <div className="actions">
            <button type="button" onClick={onBackToMenu}>
              Back to menu
            </button>
          </div>
        </div>
      ) : null}

      <LobbyPanel
        session={session}
        room={room}
        availableRooms={availableRooms}
        currentPlayerId={currentPlayerId}
        roomIdInput={roomIdInput}
        errorMessage={errorMessage}
        onRoomIdInputChange={setRoomIdInput}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onJoinRoomById={async (id) => {
          try {
            await joinRoom(id);
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to join room.");
          }
        }}
        onLeaveRoom={handleLeaveRoom}
        onDeleteRoom={handleDeleteRoom}
        onStartGameplay={handleStartGameplay}
        isStarting={isStarting}
      />
    </>
  );
}
