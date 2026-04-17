import type { CommentReactionType } from '@/interface/post';

export type ReactionFilterTab = 'ALL' | CommentReactionType;

export type ReactionFriendAction = 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'ADD_FRIEND';
