import { apiClient } from './apiClient';
import type {
  Post,
  PostReactionType,
  PostReactionUser,
  PostReactionUsersResponse,
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

interface PostAuthorPayload {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface PostPayload {
  id: string;
  userId: string;
  author?: PostAuthorPayload;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  likeCount?: number;
  reactionCount?: number;
  currentUserReactionType?: string | null;
  topReactionTypes?: string[] | null;
  commentCount: number;
  likedByCurrentUser?: boolean;
}

interface LikeStatePayload {
  postId: string;
  liked: boolean;
  likeCount: number;
}

interface PostReactionStatePayload {
  postId: string;
  reactionType?: string | null;
  reactionCount?: number;
  topReactionTypes?: string[] | null;
}

interface PostReactionUserPayload {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType?: string | null;
  reactedAt?: string;
}

interface PostReactionUsersPayload {
  postId: string;
  totalCount?: number;
  users?: PostReactionUserPayload[] | null;
}

export interface PaginatedPosts {
  items: Post[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreatePostRequest {
  content: string;
  imageUrl?: string;
}

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!response.data) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

const parseReactionType = (value?: string | null): PostReactionType | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  const allowedReactionTypes: PostReactionType[] = ['LIKE', 'WOW', 'SAD', 'ANGRY', 'HAHA', 'LOVE'];
  return allowedReactionTypes.includes(normalized as PostReactionType)
    ? (normalized as PostReactionType)
    : null;
};

const parseReactionTypes = (values?: string[] | null): PostReactionType[] => {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const mapped = values
    .map((value) => parseReactionType(value))
    .filter((value): value is PostReactionType => Boolean(value));

  return Array.from(new Set(mapped)).slice(0, 3);
};

const mapReactionUser = (payload: PostReactionUserPayload): PostReactionUser | null => {
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

export const mapPost = (payload: PostPayload): Post => {
  const authorName = payload.author?.displayName?.trim() || payload.author?.username?.trim() || 'user';
  const authorId = payload.author?.id || payload.userId;
  const username = payload.author?.username?.trim() || 'user';
  const reactionCount = typeof payload.reactionCount === 'number'
    ? Math.max(0, payload.reactionCount)
    : Math.max(0, payload.likeCount ?? 0);
  const currentUserReactionType = parseReactionType(payload.currentUserReactionType);
  const resolvedTopReactionTypes = parseReactionTypes(payload.topReactionTypes);
  const topReactionTypes = resolvedTopReactionTypes.length > 0
    ? resolvedTopReactionTypes
    : reactionCount > 0
      ? (['LIKE'] as PostReactionType[])
      : [];

  return {
    id: payload.id,
    author: {
      id: authorId,
      username,
      fullName: authorName,
      avatarUrl: payload.author?.avatarUrl || `https://i.pravatar.cc/150?u=${authorId}`,
    },
    content: payload.content,
    imageUrl: payload.imageUrl ?? undefined,
    createdAt: payload.createdAt,
    likes: reactionCount,
    likedByCurrentUser: payload.likedByCurrentUser ?? Boolean(currentUserReactionType),
    reactionCount,
    currentUserReactionType,
    topReactionTypes,
    commentCount: payload.commentCount,
    comments: [],
  };
};

export const postService = {
  async getPosts(page: number, pageSize: number): Promise<PaginatedPosts> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostPayload>>>('/api/posts', {
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
      hasMore: loadedCount < paged.totalCount,
    };
  },

  async createPost(request: CreatePostRequest): Promise<Post> {
    const response = await apiClient.post<ApiEnvelope<PostPayload>>('/api/posts', request);
    const created = extractData(response.data, 'Failed to create post');
    return mapPost(created);
  },

  async getPostById(postId: string): Promise<Post> {
    const response = await apiClient.get<ApiEnvelope<PostPayload>>(`/api/posts/${postId}`);
    const post = extractData(response.data, 'Failed to load post');
    return mapPost(post);
  },

  async likePost(postId: string): Promise<LikeStatePayload> {
    const response = await apiClient.post<ApiEnvelope<LikeStatePayload>>(`/api/posts/${postId}/likes`);
    return extractData(response.data, 'Failed to like post');
  },

  async unlikePost(postId: string): Promise<LikeStatePayload> {
    const response = await apiClient.delete<ApiEnvelope<LikeStatePayload>>(`/api/posts/${postId}/likes`);
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
    await apiClient.delete<ApiEnvelope<unknown>>(`/api/posts/${postId}`);
  },
};
