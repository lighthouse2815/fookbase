export interface CreatePostRequestDto {
  content: string;
  imageUrls?: string[];
}

export interface SharePostRequestDto {
  content?: string;
}

export interface SavePostRequestDto {
  postId: string;
}

export type CreatePostRequest = CreatePostRequestDto;
export type SharePostRequest = SharePostRequestDto;
export type SavePostRequest = SavePostRequestDto;
