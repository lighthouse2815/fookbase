import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';
import { mapPost } from '@/features/post/api/mapper/mapper';
import type { 
  PagedResult, 
  ApiEnvelope, 
} from '@/shared/types/api';

import type { 
  Post ,
  PostReactionUser,
  PostReactionUsersResponse,
  PostReactionType,
  PaginatedPosts,
} from '@/features/post/types/contracts';
import type {
  CreatePostRequestDto,
  SharePostRequestDto,
  UpdatePostRequestDto,
} from '@/features/post/api/dtos/request.dto';
import type {
  PostReactionStateResponseDto,
  PostReactionUsersResponseDto,
  PostResponseDto,
} from '@/features/post/api/dtos/response.dto';
import { mapReactionUser, parseReactionType, parseReactionTypes } from '@/features/comment/utils/reaction.util';

const { POSTS } = API_ENDPOINTS;

export const postService = {
  async getPosts(page: number, pageSize: number): Promise<PaginatedPosts> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostResponseDto>>>(POSTS.LIST, {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load posts');
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

  async getPostsByHashtag(hashtag: string, page: number, pageSize: number): Promise<PaginatedPosts> {
    const normalizedHashtag = hashtag.trim().replace(/^#/, '');
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostResponseDto>>>(POSTS.BY_HASHTAG(normalizedHashtag), {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load hashtag posts');
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

  async createPost(request: CreatePostRequestDto): Promise<Post> {
    const response = await apiClient.post<ApiEnvelope<PostResponseDto>>(POSTS.CREATE, request);
    const created = extractData(response.data, 'Failed to create post');
    return mapPost(created);
  },

  async getPostById(postId: string): Promise<Post> {
    const response = await apiClient.get<ApiEnvelope<PostResponseDto>>(POSTS.BY_ID(postId));
    const post = extractData(response.data, 'Failed to load post');
    return mapPost(post);
  },

  async sharePost(postId: string, request: SharePostRequestDto = {}): Promise<Post> {
    const response = await apiClient.post<ApiEnvelope<PostResponseDto>>(POSTS.SHARE(postId), request);
    const created = extractData(response.data, 'Failed to share post');
    return mapPost(created);
  },

  async updatePost(postId: string, request: UpdatePostRequestDto): Promise<Post> {
    const response = await apiClient.put<ApiEnvelope<PostResponseDto>>(POSTS.BY_ID(postId), request);
    const updated = extractData(response.data, 'Failed to update post');
    return mapPost(updated);
  },

  async setReaction(postId: string, type: PostReactionType): Promise<{
    postId: string;
    reactionType: PostReactionType | null;
    reactionCount: number;
    topReactionTypes: PostReactionType[];
  }> {
    const response = await apiClient.put<ApiEnvelope<PostReactionStateResponseDto>>(`/api/posts/${postId}/reactions`, { type });
    const state = extractData(response.data, 'Failed to react to post');

    return {
      postId: state.postId,
      reactionType: parseReactionType(state.reactionType),
      reactionCount: typeof state.reactionCount === 'number' ? Math.max(0, state.reactionCount) : 0,
      topReactionTypes: parseReactionTypes(state.topReactionTypes),
    };
  },

  async removeReaction(postId: string): Promise<{
    postId: string;
    reactionType: PostReactionType | null;
    reactionCount: number;
    topReactionTypes: PostReactionType[];
  }> {
    const response = await apiClient.delete<ApiEnvelope<PostReactionStateResponseDto>>(`/api/posts/${postId}/reactions`);
    const state = extractData(response.data, 'Failed to remove post reaction');

    return {
      postId: state.postId,
      reactionType: parseReactionType(state.reactionType),
      reactionCount: typeof state.reactionCount === 'number' ? Math.max(0, state.reactionCount) : 0,
      topReactionTypes: parseReactionTypes(state.topReactionTypes),
    };
  },

  
  async getPostReactionUsers(postId: string): Promise<PostReactionUsersResponse> {
    const response = await apiClient.get<ApiEnvelope<PostReactionUsersResponseDto>>(`/api/posts/${postId}/reactions`);
    const payload = extractData(response.data, 'Failed to load post reactions');

    const users = Array.isArray(payload.users)
      ? payload.users
          .map(mapReactionUser)
          .filter((item): item is PostReactionUser => Boolean(item))
      : [];

    return {
      postId: payload.postId,
      totalCount: typeof payload.totalCount === 'number' ? Math.max(0, payload.totalCount) : users.length,
      users,
    };
  },

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<unknown>>(POSTS.BY_ID(postId));
  },
};



