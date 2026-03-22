import type { User } from './user';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface FriendSuggestion extends User {
  mutualFriends: number;
}

