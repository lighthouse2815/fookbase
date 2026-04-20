export type { FriendshipStatusCode } from '@/utils/friendshipStatusCode';

export type ProfilePrimaryActionType =
  | 'EDIT'
  | 'ADD'
  | 'SENT'
  | 'ACCEPT'
  | 'FRIENDS'
  | 'BLOCKED'
  | 'NONE';

export type ProfileMenuAction = 'unfriend' | 'block' | 'report';
