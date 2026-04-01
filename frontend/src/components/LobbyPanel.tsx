import RoomForm from "./RoomForm";
import type { Room, Session } from "../types/game";

interface LobbyPanelProps {
  session: Session;
  room: Room | null;
  roomIdInput: string;
  errorMessage: string | null;
  onRoomIdInputChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  onStartGameplay: () => void;
}


export default function LobbyPanel({
  session,
  room,
  roomIdInput,
  errorMessage,
  onRoomIdInputChange,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onStartGameplay,
}: LobbyPanelProps) {
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
          <p>Host: {room.hostDisplayName}</p>
          <ul className="member-list">
            {room.members.map((member) => (
              <li key={member.roomMembershipId}>
                {member.player.displayName}
                {member.player.playerId === room.hostPlayerId ? " (Host)" : ""}
              </li>
            ))}
          </ul>
          <div className="actions">
            <button type="button" onClick={onStartGameplay}>
              Start gameplay
            </button>
            <button type="button" onClick={onLeaveRoom}>
              Leave room
            </button>
          </div>
        </>
      ) : (
        <RoomForm
          roomIdInput={roomIdInput}
          onRoomIdInputChange={onRoomIdInputChange}
          onCreateRoom={onCreateRoom}
          onJoinRoom={onJoinRoom}
        />
      )}
    </section>
  );
}
