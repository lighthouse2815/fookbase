import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
import type { 
  ApiEnvelope, 
  PagedResult, 
  PaginatedResult 
} from '@/interface/api';
import type { 
  CommentPayload, 
  CommentReactionUsersPayload 
} from '@/interface/comment';

import type { 
  CommentReactionType,  
  CommentReactionUsersResponse, 
  CommentReactionUser,
  CommentReactionStatePayload,
  Comment } from '@/interface/post';
import { 
  parseReactionType,
  mapReactionUser ,
  mapComment
} from './util';

const { COMMENTS } = API_CONFIG.ENDPOINTS;

export type PaginatedComments = PaginatedResult<Comment>;

export const commentService = {
  async getCommentsByPostId(postId: string, page: number, pageSize: number): Promise<PaginatedResult<Comment>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<CommentPayload>>>(COMMENTS.BY_POST_ID(postId), {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load comments');
    const items = paged.items.map(mapComment);
    const loadedCount = paged.page * paged.pageSize;

    return {
      items,
      page: paged.page,
      pageSize: paged.pageSize,
      totalCount: paged.totalCount,
      hasMore: loadedCount < paged.totalCount,
    };
  },


  async createComment(postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    const response = await apiClient.post<ApiEnvelope<CommentPayload>>('/api/comments', {
      postId,
      content,
      parentCommentId: parentCommentId ?? null,
    });
    const created = extractData(response.data, 'Failed to create comment');
    return mapComment(created);
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await apiClient.put<ApiEnvelope<CommentPayload>>(`/api/comments/${commentId}`, { content });
    const updated = extractData(response.data, 'Failed to update comment');
    return mapComment(updated);
  },

  async getCommentById(commentId: string): Promise<Comment> {
    const response = await apiClient.get<ApiEnvelope<CommentPayload>>(`/api/comments/${commentId}`);
    const comment = extractData(response.data, 'Failed to load comment');
    return mapComment(comment);
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<unknown>>(`/api/comments/${commentId}`);
  },

  async setReaction(commentId: string, type: CommentReactionType): Promise<CommentReactionStatePayload> {
    const response = await apiClient.put<ApiEnvelope<CommentReactionStatePayload>>(`/api/comments/${commentId}/reactions`, { type });
    const state = extractData(response.data, 'Failed to react to comment');
    return {
      commentId: state.commentId,
      reactionType: parseReactionType(state.reactionType),
    };
  },

  async removeReaction(commentId: string): Promise<CommentReactionStatePayload> {
    const response = await apiClient.delete<ApiEnvelope<CommentReactionStatePayload>>(`/api/comments/${commentId}/reactions`);
    const state = extractData(response.data, 'Failed to remove comment reaction');
    return {
      commentId: state.commentId,
      reactionType: parseReactionType(state.reactionType),
    };
  },

  async getCommentReactionUsers(commentId: string): Promise<CommentReactionUsersResponse> {
    const response = await apiClient.get<ApiEnvelope<CommentReactionUsersPayload>>(`/api/comments/${commentId}/reactions`);
    const payload = extractData(response.data, 'Failed to load comment reactions');

    const users = Array.isArray(payload.users)
      ? payload.users
          .map(mapReactionUser)
          .filter((item): item is CommentReactionUser => Boolean(item))
      : [];

    return {
      commentId: payload.commentId,
      totalCount: typeof payload.totalCount === 'number' ? Math.max(0, payload.totalCount) : users.length,
      users,
    };
  },
};
