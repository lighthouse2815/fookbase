export interface CreatePostRequestDto {
  content: string;
  imageUrls?: string[];
}

export interface SavePostRequestDto {
  postId: string;
}

export type CreatePostRequest = CreatePostRequestDto;
export type SavePostRequest = SavePostRequestDto;
