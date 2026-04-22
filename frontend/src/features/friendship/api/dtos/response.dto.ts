export interface PendingRequesterResponseDto {
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  requester?: boolean;
  createdAt?: string;
  requestedAt?: string;
  updatedAt?: string;
  updateAt?: string;
  createAt?: string;
}

export interface ContactResponseDto {
  contactId?: string;
  userId?: string;
  id?: string;
  username?: string;
  nickName?: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  mutualFriends?: number;
  friendsCount?: number;
}

export interface JavaFriendshipResponseDto {
  friendshipId?: string;
  id?: string;
  userId?: string;
  requesterId?: string;
  addresseeId?: string;
  status?: string;
}

export interface BlockedUserResponseDto {
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  blockedAt?: string;
}
