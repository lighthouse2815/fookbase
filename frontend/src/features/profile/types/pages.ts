export type { FriendshipStatusCode } from '@/features/friendship/utils/statusCode';

export type ProfilePrimaryActionType =
  | 'EDIT'
  | 'ADD'
  | 'SENT'
  | 'ACCEPT'
  | 'FRIENDS'
  | 'BLOCKED'
  | 'NONE';

export type ProfileMenuAction = 'unfriend' | 'block' | 'report';
