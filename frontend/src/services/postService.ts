import { apiClient } from './apiClient';
import type { Post } from '../types/post';

export interface PaginatedPosts {
  items: Post[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const postService = {
  async getPosts(page: number, pageSize: number): Promise<PaginatedPosts> {
    const response = await apiClient.get<PaginatedPosts>('/api/posts', {
      params: {
        page,
        pageSize,
      },
    });

    return response.data;
  },

  async createPost(content: string): Promise<Post> {
    const response = await apiClient.post<Post>('/api/posts', { content });
    return response.data;
  },
};

