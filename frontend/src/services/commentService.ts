import { apiClient } from './apiClient';
import type {
  Comment,
  CommentReactionType,
  CommentReactionUser,
  CommentReactionUsersResponse,
} from '../types/post';

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
  displayName: string;
  avatarUrl?: string | null;
}

interface CommentPayload {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  userId: string;
  author?: CommentAuthorPayload;
  content: string;
  createdAt: string;
  updatedAt: string;
  currentUserReactionType?: string | null;
  reactionCount?: number;
  topReactionTypes?: string[] | null;
  replyCount?: number;
  replies?: CommentPayload[] | null;
}

export interface PaginatedComments {
  items: Comment[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

interface CommentReactionStatePayload {
  commentId: string;
  reactionType?: CommentReactionType | null;
}

interface CommentReactionUserPayload {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType?: string | null;
  reactedAt?: string;
}

interface CommentReactionUsersPayload {
  commentId: string;
  totalCount?: number;
  users?: CommentReactionUserPayload[] | null;
}

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!response.data) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

const parseReactionType = (value?: string | null): CommentReactionType | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  const allowedReactionTypes: CommentReactionType[] = ['LIKE', 'WOW', 'SAD', 'ANGRY', 'HAHA', 'LOVE'];
  return allowedReactionTypes.includes(normalized as CommentReactionType)
    ? (normalized as CommentReactionType)
    : null;
};

const parseReactionTypes = (values?: string[] | null): CommentReactionType[] => {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const mapped = values
    .map((value) => parseReactionType(value))
    .filter((value): value is CommentReactionType => Boolean(value));

  return Array.from(new Set(mapped)).slice(0, 3);
};

const mapReactionUser = (payload: CommentReactionUserPayload): CommentReactionUser | null => {
  const parsedReactionType = parseReactionType(payload.reactionType);
  if (!parsedReactionType) {
    return null;
  }

  const normalizedUserId = payload.userId?.trim();
  if (!normalizedUserId) {
    return null;
  }

  return {
    userId: normalizedUserId,
    displayName: payload.displayName?.trim() || 'user',
    avatarUrl: payload.avatarUrl?.trim() || `https://i.pravatar.cc/150?u=${normalizedUserId}`,
    reactionType: parsedReactionType,
    reactedAt: payload.reactedAt ?? new Date().toISOString(),
  };
};

const mapComment = (payload: CommentPayload): Comment => {
  const authorName = payload.author?.displayName?.trim() || 'user';
  const authorId = payload.author?.id || payload.userId;
  const mappedReplies = Array.isArray(payload.replies)
    ? payload.replies.map((reply) => mapComment(reply))
    : [];

  return {
    id: payload.id,
    parentCommentId: payload.parentCommentId ?? null,
    author: {
      id: authorId,
      username: 'user',
      fullName: authorName,
      avatarUrl: payload.author?.avatarUrl || `https://i.pravatar.cc/150?u=${authorId}`,
    },
    content: payload.content,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    currentUserReactionType: parseReactionType(payload.currentUserReactionType),
    reactionCount: typeof payload.reactionCount === 'number' ? Math.max(0, payload.reactionCount) : 0,
    topReactionTypes: parseReactionTypes(payload.topReactionTypes),
    replyCount: typeof payload.replyCount === 'number'
      ? Math.max(0, payload.replyCount)
      : mappedReplies.length,
    replies: mappedReplies,
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
