import { apiClient } from './apiClient';
import type { StoryReportItem } from '../types/report';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  errors?: string[];
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

interface ResolveStoryReportRequest {
  status: 'RESOLVED' | 'REJECTED';
}

interface PendingCountPayload {
  pendingCount: number;
}

export interface PaginatedStoryReports {
  items: StoryReportItem[];
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

const mapPaged = (paged: PagedResult<StoryReportItem>): PaginatedStoryReports => {
  const loadedCount = paged.page * paged.pageSize;
  return {
    items: paged.items,
    page: paged.page,
    pageSize: paged.pageSize,
    hasMore: loadedCount < paged.totalCount,
  };
};

export const storyReportService = {
  async create(storyId: string, reason: string): Promise<StoryReportItem> {
    const response = await apiClient.post<ApiEnvelope<StoryReportItem>>('/api/story-reports', {
      storyId,
      reason,
    });
    return extractData(response.data, 'Failed to report story');
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedStoryReports> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryReportItem>>>('/api/story-reports/my', {
      params: { page, pageSize },
    });
    return mapPaged(extractData(response.data, 'Failed to load story reports'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedStoryReports> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<StoryReportItem>>>('/api/story-reports', {
      params: { page, pageSize },
    });
    return mapPaged(extractData(response.data, 'Failed to load story reports'));
  },

  async resolve(reportId: string, status: ResolveStoryReportRequest['status']): Promise<StoryReportItem> {
    const response = await apiClient.patch<ApiEnvelope<StoryReportItem>>(`/api/story-reports/${reportId}/resolve`, { status });
    return extractData(response.data, 'Failed to resolve story report');
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountPayload>>('/api/story-reports/pending-count');
    const payload = extractData(response.data, 'Failed to load pending story report count');
    return payload.pendingCount;
  },
};

