import type { PostVisibility } from '@/features/post/types/contracts';

export interface CreatePostRequestDto {
  content: string;
  imageUrls?: string[];
  visibility?: PostVisibility;
}

export interface UpdatePostRequestDto {
  content: string;
  imageUrls?: string[];
  visibility?: PostVisibility;
}

export interface SharePostRequestDto {
  content?: string;
}

export interface SavePostRequestDto {
  postId: string;
}

export type CreatePostRequest = CreatePostRequestDto;
export type UpdatePostRequest = UpdatePostRequestDto;
export type SharePostRequest = SharePostRequestDto;
export type SavePostRequest = SavePostRequestDto;
