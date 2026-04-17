import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
import { mapPost } from '@/services/post/util';
import type { 
  PagedResult, 
  ApiEnvelope, 
  PaginatedResult 
} from '@/interface/api';

import type { 
  PostPayload, 
  CreatePostRequest, 
  LikeStatePayload, 
  Post ,
  PostReactionUser,
  PostReactionUsersResponse,
  PostReactionUsersPayload,
  PostReactionType,
  PostReactionStatePayload
} from '@/interface/post';
import { mapReactionUser, parseReactionType, parseReactionTypes } from '../comment/util';

const { POSTS } = API_CONFIG.ENDPOINTS;

export { mapPost } from './util';
export type PaginatedPosts = PaginatedResult<Post>;
export type { PostPayload, CreatePostRequest } from '@/interface/post';

export const postService = {
  async getPosts(page: number, pageSize: number): Promise<PaginatedResult<Post>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostPayload>>>(POSTS.LIST, {
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

  async createPost(request: CreatePostRequest): Promise<Post> {
    const response = await apiClient.post<ApiEnvelope<PostPayload>>(POSTS.CREATE, request);
    const created = extractData(response.data, 'Failed to create post');
    return mapPost(created);
  },

  async getPostById(postId: string): Promise<Post> {
    const response = await apiClient.get<ApiEnvelope<PostPayload>>(POSTS.BY_ID(postId));
    const post = extractData(response.data, 'Failed to load post');
    return mapPost(post);
  },

  async likePost(postId: string): Promise<LikeStatePayload> {
    const response = await apiClient.post<ApiEnvelope<LikeStatePayload>>(POSTS.LIKES(postId));
    return extractData(response.data, 'Failed to like post');
  },

  async unlikePost(postId: string): Promise<LikeStatePayload> {
    const response = await apiClient.delete<ApiEnvelope<LikeStatePayload>>(POSTS.LIKES(postId));
    return extractData(response.data, 'Failed to unlike post');
  },

  async setReaction(postId: string, type: PostReactionType): Promise<{
    postId: string;
    reactionType: PostReactionType | null;
    reactionCount: number;
    topReactionTypes: PostReactionType[];
  }> {
    const response = await apiClient.put<ApiEnvelope<PostReactionStatePayload>>(`/api/posts/${postId}/reactions`, { type });
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
    const response = await apiClient.delete<ApiEnvelope<PostReactionStatePayload>>(`/api/posts/${postId}/reactions`);
    const state = extractData(response.data, 'Failed to remove post reaction');

    return {
      postId: state.postId,
      reactionType: parseReactionType(state.reactionType),
      reactionCount: typeof state.reactionCount === 'number' ? Math.max(0, state.reactionCount) : 0,
      topReactionTypes: parseReactionTypes(state.topReactionTypes),
    };
  },

  
  async getPostReactionUsers(postId: string): Promise<PostReactionUsersResponse> {
    const response = await apiClient.get<ApiEnvelope<PostReactionUsersPayload>>(`/api/posts/${postId}/reactions`);
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
