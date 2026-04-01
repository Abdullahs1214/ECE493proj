from apps.accounts.models import PlayerIdentity

from services.match_service import start_multiplayer_match, start_single_player_match
from websockets.match_publisher import publish_match_start


def start_gameplay_for_mode(
    player: PlayerIdentity,
    mode: str,
    room_id: str | None = None,
):
    if mode == "single_player":
        match = start_single_player_match(player)
        publish_match_start(match)
        return match
    if mode == "multiplayer":
        if not room_id:
            raise ValueError("roomId is required for multiplayer mode.")
        match = start_multiplayer_match(player, room_id)
        publish_match_start(match)
        return match
    raise ValueError("Unsupported mode.")
