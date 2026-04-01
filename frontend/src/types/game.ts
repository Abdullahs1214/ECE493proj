export type IdentityType = "authenticated" | "guest";
export type SessionType = "authenticated" | "guest";
export type SessionStatus = "active" | "expired" | "logged_out";
export type GameMode = "single_player" | "multiplayer";

export interface PlayerIdentity {
  playerId: string;
  identityType: IdentityType;
  displayName: string;
  profileAvatar: string;
}

export interface Session {
  sessionId: string;
  sessionType: SessionType;
  status: SessionStatus;
  lastActivityAt: string;
  player: PlayerIdentity;
}
