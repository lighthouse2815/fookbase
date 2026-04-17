import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
import type { 
  PagedResult, 
  ApiEnvelope, 
  PaginatedResult 
} from '@/interface/api';

import { mapPost } from '@/services/post/util';

import type { 
  Post, 
  SavedPostStatePayload, 
  SavePostRequest, 
  PostPayload 
} from '@/interface/post';


const { SAVED_POSTS } = API_CONFIG.ENDPOINTS;

export type PaginatedSavedPosts = PaginatedResult<Post>;

export const savedPostService = {
  async getMine(page: number, pageSize: number): Promise<PaginatedResult<Post>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostPayload>>>(SAVED_POSTS.MY, {
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
      totalCount: paged.totalCount,
      hasMore: loadedCount < paged.totalCount,
    };
  },

  async savePost(postId: string): Promise<SavedPostStatePayload> {
    const response = await apiClient.post<ApiEnvelope<SavedPostStatePayload>>(SAVED_POSTS.CREATE, {
      postId,
    } satisfies SavePostRequest);

    return extractData(response.data, 'Failed to save post');
  },

  async removeSavedPost(postId: string): Promise<SavedPostStatePayload> {
    const response = await apiClient.delete<ApiEnvelope<SavedPostStatePayload>>(SAVED_POSTS.BY_POST_ID(postId));
    return extractData(response.data, 'Failed to remove saved post');
  },
};
