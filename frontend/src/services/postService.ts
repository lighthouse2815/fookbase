import { apiClient } from './apiClient';
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
  likeCount: number;
  commentCount: number;
  likedByCurrentUser?: boolean;
}

interface LikeStatePayload {
  postId: string;
  liked: boolean;
  likeCount: number;
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

export const mapPost = (payload: PostPayload): Post => {
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
    imageUrl: payload.imageUrl ?? undefined,
    createdAt: payload.createdAt,
    likes: payload.likeCount,
    likedByCurrentUser: payload.likedByCurrentUser ?? false,
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
};
