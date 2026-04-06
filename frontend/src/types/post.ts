import type { User } from './user';

export type CommentReactionType = 'LIKE' | 'WOW' | 'SAD' | 'ANGRY' | 'HAHA' | 'LOVE';
export type PostReactionType = CommentReactionType;

export type CommentReactionFriendshipStatus = 'SELF' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';

export interface Comment {
  id: string;
  parentCommentId?: string | null;
  author: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
  currentUserReactionType?: CommentReactionType | null;
  reactionCount: number;
  topReactionTypes: CommentReactionType[];
  replyCount?: number;
  replies?: Comment[];
}

export interface CommentReactionUser {
  userId: string;
  displayName: string;
  avatarUrl: string;
  reactionType: CommentReactionType;
  reactedAt: string;
}

export interface CommentReactionUsersResponse {
  commentId: string;
  totalCount: number;
  users: CommentReactionUser[];
}

export interface PostReactionUser {
  userId: string;
  displayName: string;
  avatarUrl: string;
  reactionType: PostReactionType;
  reactedAt: string;
}

export interface PostReactionUsersResponse {
  postId: string;
  totalCount: number;
  users: PostReactionUser[];
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  likedByCurrentUser?: boolean;
  reactionCount: number;
  currentUserReactionType?: PostReactionType | null;
  topReactionTypes: PostReactionType[];
  commentCount?: number;
  comments: Comment[];
}

export interface Story {
  id: string;
  author: User;
  imageUrl: string;
}

