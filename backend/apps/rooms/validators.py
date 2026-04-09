from apps.accounts.models import PlayerIdentity
from apps.rooms.models import Room


def validate_room_is_joinable(room: Room) -> None:
    if room.room_status == Room.RoomStatus.CLOSED:
        raise ValueError("Room is not open for joining.")


def validate_display_name_is_unique_in_room(room: Room, player: PlayerIdentity) -> None:
    duplicate_exists = room.memberships.select_related("player").filter(
        membership_status="active",
        player__display_name=player.display_name,
    ).exclude(player=player).exists()
    if duplicate_exists:
        raise ValueError("Display name is already in use in this room.")
