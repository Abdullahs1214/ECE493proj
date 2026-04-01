export type IdentityType = "authenticated" | "guest";
export type SessionType = "authenticated" | "guest";
export type SessionStatus = "active" | "expired" | "logged_out";
export type GameMode = "single_player" | "multiplayer";
export type RoomStatus = "open" | "closed";
export type MembershipStatus = "active" | "disconnected" | "waiting_for_next_game";

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

export interface RoomMember {
  roomMembershipId: string;
  membershipStatus: MembershipStatus;
  joinedAt: string;
  player: Pick<PlayerIdentity, "playerId" | "displayName" | "identityType">;
}

export interface Room {
  roomId: string;
  roomStatus: RoomStatus;
  hostPlayerId: string;
  hostDisplayName: string;
  members: RoomMember[];
}
