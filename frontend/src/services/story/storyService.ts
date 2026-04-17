import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
const { STORIES } = API_CONFIG.ENDPOINTS;
import type {
  StoryItem,
  StoryReactionStatePayload,
  StoryReactionType,
  StoryUploadResult,
  StoryPayload,
  StoryUploadPayload,
  StoryCreatePayload,
  StoryViewedResponse,
} from '@/interface/story';
import type { ApiEnvelope, PagedResult } from '@/interface/api';
import { mapStory, normalizeReactionType } from '@/services/story/util';
import type { PaginatedStories } from '@/type/story.type';

export const storyService = {
  async getFeed(page: number, pageSize: number): Promise<PaginatedStories> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryPayload>>>(STORIES.LIST, {
      params: { page, pageSize },
    });
    const paged = extractData(response.data, 'Failed to load story feed');
    const items = paged.items.map(mapStory);
    const loadedCount = paged.page * paged.pageSize;
    return {
      items,
      page: paged.page,
      pageSize: paged.pageSize,
      totalCount: paged.totalCount,
      hasMore: loadedCount < paged.totalCount,
    };
  },

  async getByUser(userId: string, page = 1, pageSize = 30): Promise<PaginatedStories> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryPayload>>>(STORIES.BY_USER_ID(userId), {
      params: { page, pageSize },
    });
    const paged = extractData(response.data, 'Failed to load user stories');
    const items = paged.items.map(mapStory);
    const loadedCount = paged.page * paged.pageSize;
    return {
      items,
      page: paged.page,
      pageSize: paged.pageSize,
      totalCount: paged.totalCount,
      hasMore: loadedCount < paged.totalCount,
    };
  },

  async getById(storyId: string): Promise<StoryItem> {
    const response = await apiClient.get<ApiEnvelope<StoryPayload>>(STORIES.BY_ID(storyId));
    return mapStory(extractData(response.data, 'Failed to load story'));
  },

  async uploadStoryMedia(file: File): Promise<StoryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiEnvelope<StoryUploadPayload>>(STORIES.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const uploaded = extractData(response.data, 'Failed to upload story media');
    return {
      mediaUrl: uploaded.mediaUrl,
      mediaType: uploaded.mediaType,
      sizeBytes: uploaded.sizeBytes,
    };
  },

  async createStory(payload: StoryCreatePayload): Promise<StoryItem> {
    const response = await apiClient.post<ApiEnvelope<StoryPayload>>(STORIES.CREATE, payload);
    return mapStory(extractData(response.data, 'Failed to create story'));
  },

  async markAsViewed(storyId: string): Promise<void> {
    await apiClient.post<ApiEnvelope<StoryViewedResponse>>(STORIES.VIEW(storyId));
  },

  async deleteStory(storyId: string): Promise<void> {
    await apiClient.delete(STORIES.BY_ID(storyId));
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
