import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';
import type { PagedResult, ApiEnvelope } from '@/shared/types/api';

import { mapPost } from '@/features/post/api/mapper/mapper';

import type { PaginatedSavedPosts } from '@/features/post/types/contracts';
import type { SavePostRequestDto } from '@/features/post/api/dtos/request.dto';
import type { PostResponseDto, SavedPostStateResponseDto } from '@/features/post/api/dtos/response.dto';

const { SAVED_POSTS } = API_ENDPOINTS;

export const savedPostService = {
  async getMine(page: number, pageSize: number): Promise<PaginatedSavedPosts> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostResponseDto>>>(SAVED_POSTS.MY, {
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

  async savePost(postId: string): Promise<SavedPostStateResponseDto> {
    const response = await apiClient.post<ApiEnvelope<SavedPostStateResponseDto>>(SAVED_POSTS.CREATE, {
      postId,
    } satisfies SavePostRequestDto);

    return extractData(response.data, 'Failed to save post');
  },

  async removeSavedPost(postId: string): Promise<SavedPostStateResponseDto> {
    const response = await apiClient.delete<ApiEnvelope<SavedPostStateResponseDto>>(SAVED_POSTS.BY_POST_ID(postId));
    return extractData(response.data, 'Failed to remove saved post');
  },
};



