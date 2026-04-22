import type { StoryReactionType } from '@/features/story/types/contracts';

export interface CreateStoryRequestDto {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  content?: string;
}

export interface SetStoryReactionRequestDto {
  type: StoryReactionType;
}

export type CreateStoryRequest = CreateStoryRequestDto;
export type SetStoryReactionRequest = SetStoryReactionRequestDto;
