import { useEffect, useState } from "react";

import { createRoom, joinRoom, leaveRoom } from "../services/apiClient";
import { subscribeToRoom } from "../services/realtimeClient";
import type { Room } from "../types/game";


export function useRoomState() {
  const [room, setRoom] = useState<Room | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      return;
    }

    return subscribeToRoom(
      room.roomId,
      (message) => {
        if (message.event === "room_state_update") {
          setRoom(message.room ?? null);
          if (message.roomClosed || !message.room) {
            setActiveMatchId(null);
          }
        }
        if (message.event === "match_start_update" && message.matchId) {
          setActiveMatchId(message.matchId);
        }
      },
      () => {
        setErrorMessage("Realtime room connection closed.");
      },
    );
  }, [room?.roomId]);

  async function handleCreateRoom() {
    setErrorMessage(null);
    const nextRoom = await createRoom();
    setRoom(nextRoom);
    setActiveMatchId(null);
  }

  async function handleJoinRoom(roomId: string) {
    setErrorMessage(null);
    const nextRoom = await joinRoom(roomId);
    setRoom(nextRoom);
    setActiveMatchId(null);
  }

  async function handleLeaveRoom() {
    if (!room) {
      return;
    }
    setErrorMessage(null);
    const response = await leaveRoom(room.roomId);
    setRoom(response.room);
    if (!response.room) {
      setActiveMatchId(null);
    }
  }

  return {
    room,
    activeMatchId,
    errorMessage,
    setErrorMessage,
    setActiveMatchId,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
  };
}
