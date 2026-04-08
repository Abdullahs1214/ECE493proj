import type { RealtimeMatchMessage, RealtimeRoomMessage } from "../types/game";

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000";

function connect<MessageType>(
  path: string,
  onMessage: (message: MessageType) => void,
  onClose?: () => void,
) {
  const socket = new WebSocket(`${WS_BASE_URL}${path}`);

  socket.addEventListener("message", (event) => {
    onMessage(JSON.parse(event.data) as MessageType);
  });

  socket.addEventListener("close", () => {
    onClose?.();
  });

  return () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };
}

export function subscribeToRoom(
  roomId: string,
  onMessage: (message: RealtimeRoomMessage) => void,
  onClose?: () => void,
) {
  return connect<RealtimeRoomMessage>(`/ws/rooms/${roomId}/`, onMessage, onClose);
}

export function subscribeToMatch(
  matchId: string,
  onMessage: (message: RealtimeMatchMessage) => void,
  onClose?: () => void,
) {
  return connect<RealtimeMatchMessage>(`/ws/matches/${matchId}/`, onMessage, onClose);
}