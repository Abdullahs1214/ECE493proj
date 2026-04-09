import RoomForm from "./RoomForm";
import type { Room, Session } from "../types/game";

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
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  onStartGameplay: () => void;
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
  onLeaveRoom,
  onDeleteRoom,
  onStartGameplay,
}: LobbyPanelProps) {
  const isHost = room?.hostPlayerId === currentPlayerId;

  return (
    <section className="status-card">
      <p className="eyebrow">Lobby</p>
      <h2>Multiplayer Room</h2>
      <p>Active player: {session.player.displayName}</p>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}

      {room ? (
        <>
          <p>Room ID: {room.roomId}</p>
          <p>Room status: {room.roomStatus}</p>
          <p>Join policy: {room.joinPolicy}</p>
          <p>Host: {room.hostDisplayName}</p>
          <ul className="member-list">
            {room.members.map((member) => (
              <li key={member.roomMembershipId}>
                {member.player.displayName}
                {member.player.playerId === room.hostPlayerId ? " (Host)" : ""}
                {member.membershipStatus === "waiting_for_next_game" ? " (Waiting)" : ""}
                {member.membershipStatus === "disconnected" ? " (Disconnected)" : ""}
              </li>
            ))}
          </ul>
          <div className="actions">
            <button type="button" onClick={onStartGameplay} disabled={!isHost}>
              Start gameplay
            </button>
            {isHost ? (
              <button type="button" onClick={onDeleteRoom}>
                Delete room
              </button>
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
          <h3>Available rooms</h3>
          <ul className="member-list">
            {availableRooms.map((availableRoom) => (
              <li key={availableRoom.roomId}>
                {availableRoom.hostDisplayName} - {availableRoom.roomStatus}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
