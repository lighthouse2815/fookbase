import type { CommentReactionType } from '@/features/post/types/contracts';

export interface PostAuthorResponseDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface PostResponseDto {
  id: string;
  userId: string;
  author?: PostAuthorResponseDto;
  content: string;
  imageUrls?: string[] | null;
  createdAt: string;
  likeCount?: number;
  reactionCount?: number;
  currentUserReactionType?: string | null;
  topReactionTypes?: string[] | null;
  commentCount: number;
  likedByCurrentUser?: boolean;
}

export interface CommentReactionStateResponseDto {
  commentId: string;
  reactionType?: CommentReactionType | null;
}

export interface CommentReactionUserResponseDto {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType?: string | null;
  reactedAt?: string;
}

export interface SavedPostStateResponseDto {
  postId: string;
  saved: boolean;
  savedAt?: string | null;
}

export interface PostReactionUserResponseDto {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType?: string | null;
  reactedAt?: string;
}

export interface PostReactionUsersResponseDto {
  postId: string;
  totalCount?: number;
  users?: PostReactionUserResponseDto[] | null;
}

export interface PostReactionStateResponseDto {
  postId: string;
  reactionType?: string | null;
  reactionCount?: number;
  topReactionTypes?: string[] | null;
}

export type PostAuthorPayload = PostAuthorResponseDto;
export type PostPayload = PostResponseDto;
export type CommentReactionStatePayload = CommentReactionStateResponseDto;
export type CommentReactionUserPayload = CommentReactionUserResponseDto;
export type SavedPostStatePayload = SavedPostStateResponseDto;
export type PostReactionUserPayload = PostReactionUserResponseDto;
export type PostReactionUsersPayload = PostReactionUsersResponseDto;
export type PostReactionStatePayload = PostReactionStateResponseDto;
