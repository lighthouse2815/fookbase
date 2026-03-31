import { apiClient } from './apiClient';
import type { PostReportItem } from '../types/report';

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

interface CreatePostReportRequest {
  postId: string;
  reason: string;
}

interface ResolvePostReportRequest {
  status: 'RESOLVED' | 'REJECTED';
}

interface PendingCountPayload {
  pendingCount: number;
}

export interface PaginatedPostReports {
  items: PostReportItem[];
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

const mapPaged = (paged: PagedResult<PostReportItem>): PaginatedPostReports => {
  const loadedCount = paged.page * paged.pageSize;
  return {
    items: paged.items,
    page: paged.page,
    pageSize: paged.pageSize,
    hasMore: loadedCount < paged.totalCount,
  };
};

export const postReportService = {
  async create(postId: string, reason: string): Promise<PostReportItem> {
    const response = await apiClient.post<ApiEnvelope<PostReportItem>>('/api/post-reports', {
      postId,
      reason,
    } satisfies CreatePostReportRequest);

    return extractData(response.data, 'Failed to report post');
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedPostReports> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostReportItem>>>('/api/post-reports/my', {
      params: {
        page,
        pageSize,
      },
    });

    return mapPaged(extractData(response.data, 'Failed to load reported posts'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedPostReports> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostReportItem>>>('/api/post-reports', {
      params: {
        page,
        pageSize,
      },
    });

    return mapPaged(extractData(response.data, 'Failed to load reports'));
  },

  async resolve(reportId: string, status: ResolvePostReportRequest['status']): Promise<PostReportItem> {
    const response = await apiClient.patch<ApiEnvelope<PostReportItem>>(`/api/post-reports/${reportId}/resolve`, {
      status,
    } satisfies ResolvePostReportRequest);

    return extractData(response.data, 'Failed to resolve report');
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountPayload>>('/api/post-reports/pending-count');
    const payload = extractData(response.data, 'Failed to load pending report count');
    return payload.pendingCount;
  },
};
