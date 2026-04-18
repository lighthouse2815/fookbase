export type { FriendshipStatusCode } from '@/utils/friendshipStatusCode';

export type ProfilePrimaryActionType =
  | 'EDIT'
  | 'ADD'
  | 'CANCEL'
  | 'ACCEPT'
  | 'FRIENDS'
  | 'BLOCKED'
  | 'NONE';

export type ProfileMenuAction = 'unfriend' | 'block' | 'report';
