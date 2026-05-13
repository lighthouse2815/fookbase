import type { PaginatedResult } from '@/shared/types/api';
import type { User } from '@/features/user/types/contracts';

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

export interface SharedPostReference {
  id: string;
  author: User;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  reactionCount: number;
  commentCount: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  likes: number;
  likedByCurrentUser?: boolean;
  reactionCount: number;
  currentUserReactionType?: PostReactionType | null;
  topReactionTypes: PostReactionType[];
  commentCount?: number;
  shareCount: number;
  originalPost?: SharedPostReference | null;
  comments: Comment[];
}

export interface CreatePostDraft {
  content: string;
  imageFiles?: File[];
  videoFile?: File;
}

export type PaginatedPosts = PaginatedResult<Post>;
export type PaginatedSavedPosts = PaginatedResult<Post>;

