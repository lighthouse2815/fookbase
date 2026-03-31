import { apiClient } from './apiClient';
import { mapPost, type PostPayload } from './postService';
import type { Post } from '../types/post';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface SavedPostStatePayload {
  postId: string;
  saved: boolean;
  savedAt?: string | null;
}

interface SavePostRequest {
  postId: string;
}

export interface PaginatedSavedPosts {
  items: Post[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!response.data) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

export const savedPostService = {
  async getMine(page: number, pageSize: number): Promise<PaginatedSavedPosts> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostPayload>>>('/api/saved-posts/my', {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load saved posts');
    const items = paged.items.map(mapPost);
    const loadedCount = paged.page * paged.pageSize;

    return {
      items,
      page: paged.page,
      pageSize: paged.pageSize,
      hasMore: loadedCount < paged.totalCount,
    };
  },

  async savePost(postId: string): Promise<SavedPostStatePayload> {
    const response = await apiClient.post<ApiEnvelope<SavedPostStatePayload>>('/api/saved-posts', {
      postId,
    } satisfies SavePostRequest);

    return extractData(response.data, 'Failed to save post');
  },

  async removeSavedPost(postId: string): Promise<SavedPostStatePayload> {
    const response = await apiClient.delete<ApiEnvelope<SavedPostStatePayload>>(`/api/saved-posts/${postId}`);
    return extractData(response.data, 'Failed to remove saved post');
  },
};
