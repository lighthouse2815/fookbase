export interface SendFriendRequestRequestDto {
  addresseeId: string;
  userId: string;
}

export interface SendFriendRequestFallbackRequestDto {
  addresseeId: string;
}

export interface FriendshipRequestActionRequestDto {
  requestId: string;
  userId: string;
}

export interface CancelFriendRequestRequestDto {
  requestId: string;
}

export interface UnfriendRequestDto {
  friendId: string;
  userId: string;
}

export interface BlockUserRequestDto {
  userId: string;
  targetUserId: string;
}

export interface ReportUserRequestDto {
  targetUserId: string;
  reason: string;
}

export interface LegacyReportUserRequestDto {
  userId: string;
  targetUserId: string;
  reason: string;
}
