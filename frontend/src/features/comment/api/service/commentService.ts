import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';
import type { ApiEnvelope, PagedResult } from '@/shared/types/api';
import type {
  CreateCommentRequestDto,
  SetCommentReactionRequestDto,
  UpdateCommentRequestDto,
} from '@/features/comment/api/dtos/request.dto';
import type {
  CommentReactionStateResponseDto,
  CommentReactionUsersResponseDto,
  CommentResponseDto,
} from '@/features/comment/api/dtos/response.dto';
import {
  mapCommentReactionStateResponseDto,
  mapCommentReactionUsersResponseDto,
  mapCommentResponseDtoToComment,
} from '@/features/comment/api/mapper/mapper';
import type {
  Comment,
  CommentReactionState,
  CommentReactionType,
  CommentReactionUsersResponse,
  PaginatedComments,
} from '@/features/comment/types/contracts';

const { COMMENTS } = API_ENDPOINTS;
const COMMENT_ENDPOINTS = {
  CREATE: COMMENTS.CREATE,
  BY_ID: (commentId: string) => `/api/comments/${commentId}`,
  REACTIONS: (commentId: string) => `/api/comments/${commentId}/reactions`,
} as const;

export const commentService = {
  async getCommentsByPostId(postId: string, page: number, pageSize: number): Promise<PaginatedComments> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<CommentResponseDto>>>(COMMENTS.BY_POST_ID(postId), {
      params: {
        page,
        pageSize,
      },
    });

    const paged = extractData(response.data, 'Failed to load comments');
    const items = paged.items.map(mapCommentResponseDtoToComment);
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
    const payload: CreateCommentRequestDto = {
      postId,
      content,
      parentCommentId: parentCommentId ?? null,
    };
    const response = await apiClient.post<ApiEnvelope<CommentResponseDto>>(COMMENT_ENDPOINTS.CREATE, payload);
    const created = extractData(response.data, 'Failed to create comment');
    return mapCommentResponseDtoToComment(created);
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const payload: UpdateCommentRequestDto = { content };
    const response = await apiClient.put<ApiEnvelope<CommentResponseDto>>(COMMENT_ENDPOINTS.BY_ID(commentId), payload);
    const updated = extractData(response.data, 'Failed to update comment');
    return mapCommentResponseDtoToComment(updated);
  },

  async getCommentById(commentId: string): Promise<Comment> {
    const response = await apiClient.get<ApiEnvelope<CommentResponseDto>>(COMMENT_ENDPOINTS.BY_ID(commentId));
    const comment = extractData(response.data, 'Failed to load comment');
    return mapCommentResponseDtoToComment(comment);
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<unknown>>(COMMENT_ENDPOINTS.BY_ID(commentId));
  },

  async setReaction(commentId: string, type: CommentReactionType): Promise<CommentReactionState> {
    const payload: SetCommentReactionRequestDto = { type };
    const response = await apiClient.put<ApiEnvelope<CommentReactionStateResponseDto>>(
      COMMENT_ENDPOINTS.REACTIONS(commentId),
      payload,
    );
    const state = extractData(response.data, 'Failed to react to comment');
    return mapCommentReactionStateResponseDto(state);
  },

  async removeReaction(commentId: string): Promise<CommentReactionState> {
    const response = await apiClient.delete<ApiEnvelope<CommentReactionStateResponseDto>>(
      COMMENT_ENDPOINTS.REACTIONS(commentId),
    );
    const state = extractData(response.data, 'Failed to remove comment reaction');
    return mapCommentReactionStateResponseDto(state);
  },

  async getCommentReactionUsers(commentId: string): Promise<CommentReactionUsersResponse> {
    const response = await apiClient.get<ApiEnvelope<CommentReactionUsersResponseDto>>(
      COMMENT_ENDPOINTS.REACTIONS(commentId),
    );
    const payload = extractData(response.data, 'Failed to load comment reactions');
    return mapCommentReactionUsersResponseDto(payload);
  },
};

