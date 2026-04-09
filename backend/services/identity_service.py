from __future__ import annotations

from typing import Any

from django.utils import timezone

from apps.accounts.models import PlayerIdentity, Session

GUEST_SESSION_TIMEOUT_MINUTES = 30
AUTHENTICATED_SESSION_TIMEOUT_DAYS = 7


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


def create_authenticated_session(
    oauth_identity: str,
    display_name: str,
    profile_avatar: str = "",
) -> Session:
    identity, created = PlayerIdentity.objects.get_or_create(
        oauth_identity=oauth_identity,
        defaults={
            "identity_type": PlayerIdentity.IdentityType.AUTHENTICATED,
            "display_name": display_name.strip(),
            "profile_avatar": profile_avatar,
        },
    )
    if not created:
        identity.identity_type = PlayerIdentity.IdentityType.AUTHENTICATED
        identity.display_name = display_name.strip() or identity.display_name
        identity.profile_avatar = profile_avatar
        identity.save(update_fields=["identity_type", "display_name", "profile_avatar"])

    Session.objects.filter(player=identity, status=Session.Status.ACTIVE).update(
        status=Session.Status.LOGGED_OUT,
    )
    return Session.objects.create(
        player=identity,
        session_type=Session.SessionType.AUTHENTICATED,
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
    if session is None:
        return None

    expiry_threshold = (
        timezone.now() - timezone.timedelta(minutes=GUEST_SESSION_TIMEOUT_MINUTES)
        if session.session_type == Session.SessionType.GUEST
        else timezone.now() - timezone.timedelta(days=AUTHENTICATED_SESSION_TIMEOUT_DAYS)
    )

    if session.last_activity_at < expiry_threshold:
        session.status = Session.Status.EXPIRED
        session.save(update_fields=["status", "last_activity_at"])
        return None

    session.save(update_fields=["last_activity_at"])
    return session


def update_guest_display_name(session: Session, display_name: str) -> Session:
    session.player.display_name = display_name.strip()
    session.player.save(update_fields=["display_name"])
    session.refresh_from_db()
    return session


def update_player_avatar(session: Session, profile_avatar: str) -> Session:
    session.player.profile_avatar = profile_avatar.strip()
    session.player.save(update_fields=["profile_avatar"])
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
