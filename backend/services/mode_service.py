from apps.accounts.models import PlayerIdentity

from services.match_service import start_multiplayer_match, start_single_player_match


def start_gameplay_for_mode(
    player: PlayerIdentity,
    mode: str,
    room_id: str | None = None,
):
    if mode == "single_player":
        return start_single_player_match(player)
    if mode == "multiplayer":
        if not room_id:
            raise ValueError("roomId is required for multiplayer mode.")
        return start_multiplayer_match(player, room_id)
    raise ValueError("Unsupported mode.")
