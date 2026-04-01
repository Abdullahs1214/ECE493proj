import { useState } from "react";

import BlendGameContainer from "./BlendGameContainer";
import LobbyPanel from "../components/LobbyPanel";
import { useRoomState } from "../hooks/useRoomState";
import type { Session } from "../types/game";

interface LobbyContainerProps {
  session: Session;
}


export default function LobbyContainer({ session }: LobbyContainerProps) {
  const { room, errorMessage, setErrorMessage, createRoom, joinRoom, leaveRoom } =
    useRoomState();
  const [roomIdInput, setRoomIdInput] = useState("");
  const [gameplayStarted, setGameplayStarted] = useState(false);

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
      setGameplayStarted(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to leave room.");
    }
  }

  function handleStartGameplay() {
    if (room) {
      setGameplayStarted(true);
    }
  }

  if (room && gameplayStarted) {
    return <BlendGameContainer mode="multiplayer" roomId={room.roomId} />;
  }

  return (
    <LobbyPanel
      session={session}
      room={room}
      roomIdInput={roomIdInput}
      errorMessage={errorMessage}
      onRoomIdInputChange={setRoomIdInput}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onLeaveRoom={handleLeaveRoom}
      onStartGameplay={handleStartGameplay}
    />
  );
}
