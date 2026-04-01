interface RoomFormProps {
  roomIdInput: string;
  onRoomIdInputChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}


export default function RoomForm({
  roomIdInput,
  onRoomIdInputChange,
  onCreateRoom,
  onJoinRoom,
}: RoomFormProps) {
  return (
    <>
      <div className="actions">
        <button type="button" onClick={onCreateRoom}>
          Create room
        </button>
      </div>
      <label>
        Room ID
        <input
          value={roomIdInput}
          onChange={(event) => onRoomIdInputChange(event.target.value)}
          placeholder="Enter a room ID"
        />
      </label>
      <div className="actions">
        <button type="button" onClick={onJoinRoom}>
          Join room
        </button>
      </div>
    </>
  );
}
