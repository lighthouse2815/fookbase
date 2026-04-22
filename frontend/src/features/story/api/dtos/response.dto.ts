export interface StoryAuthorResponseDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

export interface StoryResponseDto {
  id: string;
  userId: string;
  author: StoryAuthorResponseDto;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  content?: string | null;
  createdAt: string;
  expiredAt: string;
  isViewedByCurrentUser: boolean;
  currentUserReactionType?: string | null;
  viewCount: number;
}

export interface StoryUploadResponseDto {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  sizeBytes: number;
}

export interface StoryViewedResponseDto {
  message: string;
}

export interface StoryReactionStateResponseDto {
  storyId: string;
  reactionType: string | null;
}

export type StoryAuthorPayload = StoryAuthorResponseDto;
export type StoryPayload = StoryResponseDto;
export type StoryUploadPayload = StoryUploadResponseDto;
export type StoryViewedPayload = StoryViewedResponseDto;
export type StoryReactionStatePayload = StoryReactionStateResponseDto;
