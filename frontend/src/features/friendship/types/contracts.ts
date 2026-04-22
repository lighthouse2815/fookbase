import type { User } from '@/features/user/types/contracts';

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
  updatedAt?: string;
  createdAt?: string;
  updateAt?: string;
  createAt?: string;
}

export interface FriendUser extends User {
  friendshipId?: string;
  mutualFriends: number;
  friendsCount?: number;
  bio?: string;
  coverUrl?: string;
  since?: string;
}

export interface BlockedUser extends User {
  blockedAt?: string;
}

