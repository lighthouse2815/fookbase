export type FriendshipStatusCode =
  | 'NONE'
  | 'PENDING'
  | 'INVITED'
  | 'ACCEPTED'
  | 'BLOCKED'
  | 'REJECTED'
  | 'REMOVED'
  | 'UNKNOWN';

export type ProfilePrimaryActionType =
  | 'EDIT'
  | 'ADD'
  | 'CANCEL'
  | 'ACCEPT'
  | 'FRIENDS'
  | 'BLOCKED'
  | 'NONE';

export type ProfileMenuAction = 'unfriend' | 'block' | 'report';
