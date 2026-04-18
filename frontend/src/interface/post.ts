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

export interface PostAuthorPayload {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface PostPayload {
  id: string;
  userId: string;
  author?: PostAuthorPayload;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  likeCount?: number;
  reactionCount?: number;
  currentUserReactionType?: string | null;
  topReactionTypes?: string[] | null;
  commentCount: number;
  likedByCurrentUser?: boolean;
}

export interface CreatePostDraft {
  content: string;
  mediaFile?: File;
}

export interface CommentReactionStatePayload {
  commentId: string;
  reactionType?: CommentReactionType | null;
}

export interface CommentReactionUserPayload {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType?: string | null;
  reactedAt?: string;
}

export interface LikeStatePayload {
  postId: string;
  liked: boolean;
  likeCount: number;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
}

export interface SavedPostStatePayload {
  postId: string;
  saved: boolean;
  savedAt?: string | null;
}

export interface SavePostRequest {
  postId: string;
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
export interface PostReactionUserPayload {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType?: string | null;
  reactedAt?: string;
}

export interface PostReactionUsersPayload {
  postId: string;
  totalCount?: number;
  users?: PostReactionUserPayload[] | null;
}


export interface PostReactionStatePayload {
  postId: string;
  reactionType?: string | null;
  reactionCount?: number;
  topReactionTypes?: string[] | null;
}