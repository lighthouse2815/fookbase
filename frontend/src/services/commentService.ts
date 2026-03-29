import { apiClient } from './apiClient';
import type { Comment } from '../types/post';

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
  totalPages: number;
}

interface CommentAuthorPayload {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface CommentPayload {
  id: string;
  postId: string;
  userId: string;
  author?: CommentAuthorPayload;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedComments {
  items: Comment[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!response.data) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

const mapComment = (payload: CommentPayload): Comment => {
  const authorName = payload.author?.displayName?.trim() || payload.author?.username?.trim() || 'user';
  const authorId = payload.author?.id || payload.userId;
  const username = payload.author?.username?.trim() || 'user';

  return {
    id: payload.id,
    author: {
      id: authorId,
      username,
      fullName: authorName,
      avatarUrl: payload.author?.avatarUrl || `https://i.pravatar.cc/150?u=${authorId}`,
    },
    content: payload.content,
    createdAt: payload.createdAt,
  };
};

export const commentService = {
  async getCommentsByPostId(postId: string, page: number, pageSize: number): Promise<PaginatedComments> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<CommentPayload>>>(`/api/comments/post/${postId}`, {
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

  async createComment(postId: string, content: string): Promise<Comment> {
    const response = await apiClient.post<ApiEnvelope<CommentPayload>>('/api/comments', { postId, content });
    const created = extractData(response.data, 'Failed to create comment');
    return mapComment(created);
  },
};
