import { useState } from "react";

import { createRoom, joinRoom, leaveRoom } from "../services/apiClient";
import type { Room } from "../types/game";


export function useRoomState() {
  const [room, setRoom] = useState<Room | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreateRoom() {
    setErrorMessage(null);
    const nextRoom = await createRoom();
    setRoom(nextRoom);
  }

  async function handleJoinRoom(roomId: string) {
    setErrorMessage(null);
    const nextRoom = await joinRoom(roomId);
    setRoom(nextRoom);
  }

  async function handleLeaveRoom() {
    if (!room) {
      return;
    }
    setErrorMessage(null);
    const response = await leaveRoom(room.roomId);
    setRoom(response.room);
  }

  return {
    room,
    errorMessage,
    setErrorMessage,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
  };
}
