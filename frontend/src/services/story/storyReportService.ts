import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData, mapPaged } from '@/services/util';
import type { StoryReportItem, ResolveStoryReportRequest } from '@/interface/report';
import type { ApiEnvelope, PagedResult, PaginatedResult } from '@/interface/api';

const { STORY_REPORTS } = API_CONFIG.ENDPOINTS;

interface PendingCountPayload {
  pendingCount: number;
}

export const storyReportService = {
  async create(storyId: string, reason: string): Promise<StoryReportItem> {
    const response = await apiClient.post<ApiEnvelope<StoryReportItem>>(STORY_REPORTS.CREATE, {
      storyId,
      reason,
    });
    return extractData(response.data, 'Failed to report story');
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedResult<StoryReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryReportItem>>>(STORY_REPORTS.MY, {
      params: { page, pageSize },
    });
    return mapPaged(extractData(response.data, 'Failed to load story reports'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedResult<StoryReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryReportItem>>>(STORY_REPORTS.LIST, {
      params: { page, pageSize },
    });
    return mapPaged(extractData(response.data, 'Failed to load story reports'));
  },

  async resolve(reportId: string, status: ResolveStoryReportRequest['status']): Promise<StoryReportItem> {
    const response = await apiClient.patch<ApiEnvelope<StoryReportItem>>(STORY_REPORTS.RESOLVE(reportId), { status });
    return extractData(response.data, 'Failed to resolve story report');
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountPayload>>(STORY_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending story report count');
    return payload.pendingCount;
  },
};
