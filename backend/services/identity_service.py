from __future__ import annotations

from typing import Any

from apps.accounts.models import PlayerIdentity, Session


def _serialize_identity(identity: PlayerIdentity) -> dict[str, Any]:
    return {
        "playerId": str(identity.player_id),
        "identityType": identity.identity_type,
        "displayName": identity.display_name,
        "profileAvatar": identity.profile_avatar,
    }


def _serialize_session(session: Session) -> dict[str, Any]:
    return {
        "sessionId": str(session.session_id),
        "sessionType": session.session_type,
        "status": session.status,
        "lastActivityAt": session.last_activity_at.isoformat(),
        "player": _serialize_identity(session.player),
    }


def _next_guest_name() -> str:
    guest_number = (
        PlayerIdentity.objects.filter(
        identity_type=PlayerIdentity.IdentityType.GUEST
        ).count()
        + 1
    )
    return f"Guest {guest_number}"


def create_guest_session(display_name: str | None = None) -> Session:
    resolved_name = (display_name or "").strip() or _next_guest_name()
    identity = PlayerIdentity.objects.create(
        identity_type=PlayerIdentity.IdentityType.GUEST,
        display_name=resolved_name,
    )
    return Session.objects.create(
        player=identity,
        session_type=Session.SessionType.GUEST,
        status=Session.Status.ACTIVE,
    )


def get_active_session(session_id: str | None) -> Session | None:
    if not session_id:
        return None
    session = (
        Session.objects.select_related("player")
        .filter(session_id=session_id, status=Session.Status.ACTIVE)
        .first()
    )
    return session


def update_guest_display_name(session: Session, display_name: str) -> Session:
    session.player.display_name = display_name.strip()
    session.player.save(update_fields=["display_name"])
    session.refresh_from_db()
    return session


def logout_session(session: Session) -> Session:
    session.status = Session.Status.LOGGED_OUT
    session.save(update_fields=["status", "last_activity_at"])
    return session


def serialize_session(session: Session) -> dict[str, Any]:
    return _serialize_session(session)


def serialize_profile(identity: PlayerIdentity) -> dict[str, Any]:
    return _serialize_identity(identity)
