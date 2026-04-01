export type IdentityType = "authenticated" | "guest";
export type SessionType = "authenticated" | "guest";
export type SessionStatus = "active" | "expired" | "logged_out";
export type GameMode = "single_player" | "multiplayer";
export type RoomStatus = "open" | "closed";
export type MembershipStatus = "active" | "disconnected" | "waiting_for_next_game";
export type MatchStatus = "waiting_for_players" | "active_round" | "scoring" | "results" | "ended";
export type RoundStatus = "active_blending" | "submission_closed" | "scoring" | "results";

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

export interface GameplayRound {
  roundId: string;
  roundNumber: number;
  roundStatus: RoundStatus;
  targetColor: number[];
  baseColorSet: number[][];
  timeLimit: number;
  remainingSeconds: number;
}

export interface GameplaySubmission {
  playerId: string;
  displayName: string;
  submissionStatus: string;
  submissionOrder: number | null;
  blendedColor: number[];
}

export interface GameplayResult {
  playerId: string;
  displayName: string;
  blendedColor: number[] | null;
  colorDistance: number;
  score: number;
  similarityPercentage: number;
  rank: number;
  tieBreakBasis: string;
}

export interface GameplayState {
  matchId: string;
  mode: GameMode;
  matchStatus: MatchStatus;
  currentRoundNumber: number;
  round: GameplayRound;
  submissions: GameplaySubmission[];
  results: GameplayResult[];
}

export interface HistoryEntry {
  scoreHistoryEntryId: string;
  historyScope: "room_scoped" | "identity_scoped";
  roomId: string | null;
  roundId: string;
  scoreRecordId: string;
  displayName: string;
  score: number;
  similarityPercentage: number;
  rank: number;
}

export interface SocialInteractionEntry {
  socialInteractionId: string;
  interactionType: "upvote" | "highlight" | "preset_message";
  playerId: string;
  displayName: string;
  targetSubmissionId: string | null;
  targetDisplayName: string | null;
  presetMessage: string;
}

export interface SocialSubmissionSummary {
  submissionId: string;
  playerId: string;
  displayName: string;
  upvoteCount: number;
  highlightCount: number;
  hasUpvoted: boolean;
  hasHighlighted: boolean;
}

export interface SocialInteractionState {
  presetMessages: string[];
  interactions: SocialInteractionEntry[];
  submissionSummaries: SocialSubmissionSummary[];
  crowdFavorite: {
    submissionId: string;
    playerId: string;
    displayName: string;
    reactionCount: number;
    upvoteCount: number;
    highlightCount: number;
  } | null;
}
