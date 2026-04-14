import { apiClient } from './apiClient';
import type { StoryItem, StoryMediaType, StoryReactionType } from '../types/story';

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
}

interface StoryAuthorPayload {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

interface StoryPayload {
  id: string;
  userId: string;
  author: StoryAuthorPayload;
  mediaUrl: string;
  mediaType: StoryMediaType;
  content?: string | null;
  createdAt: string;
  expiredAt: string;
  isViewedByCurrentUser: boolean;
  currentUserReactionType?: string | null;
  viewCount: number;
}

interface StoryReactionStatePayload {
  storyId: string;
  reactionType: string | null;
}

interface StoryViewedResponse {
  message: string;
}

interface StoryCreatePayload {
  mediaUrl: string;
  mediaType: StoryMediaType;
  content?: string;
}

export interface PaginatedStories {
  items: StoryItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (!response.data) {
    throw new Error(response.errors?.[0] ?? fallbackError);
  }

  return response.data;
};

const resolveStoryMediaUrl = (mediaUrl: string): string => {
  const normalized = mediaUrl.trim();
  if (!normalized) {
    return normalized;
  }

  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  const baseUrl = apiClient.defaults.baseURL;
  if (!baseUrl) {
    return normalized;
  }

  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return normalized;
  }
};

const mapStory = (payload: StoryPayload): StoryItem => ({
  id: payload.id,
  userId: payload.userId,
  author: {
    id: payload.author.id,
    username: payload.author.username,
    displayName: payload.author.displayName,
    avatarUrl: payload.author.avatarUrl,
  },
  mediaUrl: resolveStoryMediaUrl(payload.mediaUrl),
  mediaType: payload.mediaType,
  content: payload.content ?? undefined,
  createdAt: payload.createdAt,
  expiredAt: payload.expiredAt,
  isViewedByCurrentUser: payload.isViewedByCurrentUser,
  currentUserReactionType: normalizeReactionType(payload.currentUserReactionType),
  viewCount: payload.viewCount,
});

const normalizeReactionType = (value?: string | null): StoryReactionType | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === 'LIKE' || normalized === 'WOW' || normalized === 'SAD' || normalized === 'ANGRY' || normalized === 'HAHA' || normalized === 'LOVE') {
    return normalized;
  }

  return null;
};

const mapPagedStories = (paged: PagedResult<StoryPayload>): PaginatedStories => {
  const loadedCount = paged.page * paged.pageSize;
  return {
    items: paged.items.map(mapStory),
    page: paged.page,
    pageSize: paged.pageSize,
    hasMore: loadedCount < paged.totalCount,
  };
};

export const storyService = {
  async getFeed(page: number, pageSize: number): Promise<PaginatedStories> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryPayload>>>('/api/stories', {
      params: { page, pageSize },
    });
    const paged = extractData(response.data, 'Failed to load story feed');
    return mapPagedStories(paged);
  },

  async getByUser(userId: string, page = 1, pageSize = 30): Promise<PaginatedStories> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryPayload>>>(`/api/stories/user/${userId}`, {
      params: { page, pageSize },
    });
    const paged = extractData(response.data, 'Failed to load user stories');
    return mapPagedStories(paged);
  },

  async getById(storyId: string): Promise<StoryItem> {
    const response = await apiClient.get<ApiEnvelope<StoryPayload>>(`/api/stories/${storyId}`);
    return mapStory(extractData(response.data, 'Failed to load story'));
  },

  async createStory(payload: StoryCreatePayload): Promise<StoryItem> {
    const response = await apiClient.post<ApiEnvelope<StoryPayload>>('/api/stories', payload);
    return mapStory(extractData(response.data, 'Failed to create story'));
  },

  async markAsViewed(storyId: string): Promise<void> {
    await apiClient.post<ApiEnvelope<StoryViewedResponse>>(`/api/stories/${storyId}/view`);
  },

  async deleteStory(storyId: string): Promise<void> {
    await apiClient.delete(`/api/stories/${storyId}`);
  },

  async setReaction(storyId: string, reactionType: StoryReactionType): Promise<StoryReactionType | null> {
    const response = await apiClient.put<ApiEnvelope<StoryReactionStatePayload>>(`/api/stories/${storyId}/reactions`, {
      type: reactionType,
    });

    const state = extractData(response.data, 'Failed to set story reaction');
    return normalizeReactionType(state.reactionType);
  },

  async removeReaction(storyId: string): Promise<void> {
    await apiClient.delete<ApiEnvelope<StoryReactionStatePayload>>(`/api/stories/${storyId}/reactions`);
  },
};
