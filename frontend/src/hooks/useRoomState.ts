import { useEffect, useState } from "react";

import {
  createRoom,
  deleteRoom,
  getCurrentRoom,
  getRooms,
  joinRoom,
  leaveRoom,
} from "../services/apiClient";
import { subscribeToRoom } from "../services/realtimeClient";
import type { Room } from "../types/game";


export function useRoomState() {
  const [room, setRoom] = useState<Room | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function refreshRoomState() {
    Promise.all([
      getCurrentRoom().catch(() => null),
      getRooms().catch(() => []),
    ]).then(([currentRoom, rooms]) => {
      setRoom(currentRoom);
      setAvailableRooms(rooms);
      if (!currentRoom || currentRoom.roomStatus !== "active_match") {
        setActiveMatchId(null);
      }
    });
  }

  useEffect(() => {
    refreshRoomState();
  }, [room?.roomId]);

  useEffect(() => {
    if (!room) {
      return;
    }

    return subscribeToRoom(
      room.roomId,
      (message) => {
        if (message.event === "room_state_update") {
          setRoom(message.room ?? null);
          getRooms()
            .then((rooms) => {
              setAvailableRooms(rooms);
            })
            .catch(() => {
              setAvailableRooms([]);
            });
          if (message.roomClosed || !message.room) {
            setActiveMatchId(null);
            return;
          }
          if (message.room.roomStatus !== "active_match") {
            setActiveMatchId(null);
          }
        }
        if (message.event === "match_start_update" && message.matchId) {
          setActiveMatchId(message.matchId);
        }
      },
      () => {
        setErrorMessage("Realtime room connection closed.");
        refreshRoomState();
      },
    );
  }, [room?.roomId]);

  async function handleCreateRoom() {
    setErrorMessage(null);
    const nextRoom = await createRoom();
    setRoom(nextRoom);
    setAvailableRooms((rooms) => [nextRoom, ...rooms.filter((roomItem) => roomItem.roomId !== nextRoom.roomId)]);
    setActiveMatchId(null);
  }

  async function handleJoinRoom(roomId: string) {
    setErrorMessage(null);
    const nextRoom = await joinRoom(roomId);
    setRoom(nextRoom);
    setAvailableRooms((rooms) => [nextRoom, ...rooms.filter((roomItem) => roomItem.roomId !== nextRoom.roomId)]);
    setActiveMatchId(null);
  }

  async function handleLeaveRoom() {
    if (!room) {
      return;
    }
    setErrorMessage(null);
    const roomId = room.roomId;
    const response = await leaveRoom(roomId);
    setRoom(null);
    setActiveMatchId(null);
    if (response.room) {
      setAvailableRooms((rooms) => [
        response.room as Room,
        ...rooms.filter((roomItem) => roomItem.roomId !== response.room?.roomId),
      ]);
      return;
    }
    setAvailableRooms((rooms) => rooms.filter((roomItem) => roomItem.roomId !== roomId));
  }

  async function handleDeleteRoom() {
    if (!room) {
      return;
    }
    setErrorMessage(null);
    await deleteRoom(room.roomId);
    setAvailableRooms((rooms) => rooms.filter((roomItem) => roomItem.roomId !== room.roomId));
    setRoom(null);
    setActiveMatchId(null);
  }

  return {
    room,
    availableRooms,
    activeMatchId,
    errorMessage,
    setErrorMessage,
    setActiveMatchId,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
    deleteRoom: handleDeleteRoom,
  };
}
