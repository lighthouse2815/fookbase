import type { User } from "./user";

export type StoryMediaType = 'IMAGE' | 'VIDEO';
export type StoryReactionType = 'LIKE' | 'WOW' | 'SAD' | 'ANGRY' | 'HAHA' | 'LOVE';

export interface StoryAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface StoryItem {
  id: string;
  userId: string;
  author: StoryAuthor;
  mediaUrl: string;
  mediaType: StoryMediaType;
  content?: string;
  createdAt: string;
  expiredAt: string;
  isViewedByCurrentUser: boolean;
  currentUserReactionType?: StoryReactionType | null;
  viewCount: number;
}

export interface StoryGroup {
  userId: string;
  author: StoryAuthor;
  stories: StoryItem[];
  hasUnviewed: boolean;
  latestCreatedAt: string;
  isMine: boolean;
}

export interface StoryUploadResult {
  mediaUrl: string;
  mediaType: StoryMediaType;
  sizeBytes: number;
}

export interface Story {
  id: string;
  author: User;
  imageUrl: string;
}

export interface StoryAuthorPayload {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface StoryPayload {
  id: string;
  userId: string;
  author: StoryAuthorPayload;
  mediaUrl: string;
  mediaType: StoryMediaType;
  content?: string | null;
  createdAt: string;
  expiredAt: string;
  isViewedByCurrentUser: boolean;
  viewCount: number;
}

export interface StoryUploadPayload {
  mediaUrl: string;
  mediaType: StoryMediaType;
  sizeBytes: number;
}

export interface StoryViewedResponse {
  message: string;
}

export interface StoryCreatePayload {
  mediaUrl: string;
  mediaType: StoryMediaType;
  content?: string;
}
export interface StoryReactionStatePayload {
  storyId: string;
  reactionType: string | null;
}