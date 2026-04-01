from __future__ import annotations

from apps.rooms.models import Room
from websockets.messages import room_state_update
from websockets.room_consumer import broker


def publish_room_state(room: Room) -> None:
    from services.room_service import serialize_room

    room.refresh_from_db()
    broker.publish(
        f"room:{room.room_id}",
        room_state_update(str(room.room_id), serialize_room(room)),
    )


def publish_room_closed(room: Room) -> None:
    broker.publish(
        f"room:{room.room_id}",
        room_state_update(str(room.room_id), None, room_closed=True),
    )
