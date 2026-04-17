import type { User } from '@/interface/user';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
}

export interface FriendSuggestion extends User {
  mutualFriends: number;
}

export interface FriendRequest extends User {
  requestId: string;
  requesterId: string;
  addresseeId: string;
  mutualFriends: number;
  requestedAt?: string;
}

export interface FriendUser extends User {
  friendshipId?: string;
  mutualFriends: number;
  friendsCount?: number;
  bio?: string;
  coverUrl?: string;
  since?: string;
}

export interface RequestCandidate {
  method: 'get' | 'post' | 'delete';
  path: string;
  data?: unknown;
  client?: 'csharp' | 'java';
}

export interface PendingRequesterPayload {
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  requester?: boolean;
  createdAt?: string;
  requestedAt?: string;
}

export interface ContactPayload {
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

export interface JavaFriendshipPayload {
  friendshipId?: string;
  id?: string;
  userId?: string;
  requesterId?: string;
  addresseeId?: string;
  status?: string;
}

export interface BlockedUserPayload {
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  blockedAt?: string;
}

export interface BlockedUser extends User {
  blockedAt?: string;
}