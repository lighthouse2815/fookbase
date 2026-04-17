import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData, mapPaged } from '@/services/util';
import type { 
  CreatePostReportRequest, 
  ResolvePostReportRequest, 
  PendingCountPayload, 
  PostReportItem 
} from '@/interface/report';
import type { PagedResult, ApiEnvelope, PaginatedResult } from '@/interface/api';

const { POST_REPORTS } = API_CONFIG.ENDPOINTS;

export const postReportService = {
  async create(postId: string, reason: string): Promise<PostReportItem> {
    const response = await apiClient.post<ApiEnvelope<PostReportItem>>(POST_REPORTS.CREATE, {
      postId,
      reason,
    } satisfies CreatePostReportRequest);

    return extractData(response.data, 'Failed to report post');
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedResult<PostReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostReportItem>>>(POST_REPORTS.MY, {
      params: {
        page,
        pageSize,
      },
    });

    return mapPaged(extractData(response.data, 'Failed to load reported posts'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedResult<PostReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<PostReportItem>>>(POST_REPORTS.LIST, {
      params: {
        page,
        pageSize,
      },
    });

    return mapPaged(extractData(response.data, 'Failed to load reports'));
  },

  async resolve(reportId: string, status: ResolvePostReportRequest['status']): Promise<PostReportItem> {
    const response = await apiClient.patch<ApiEnvelope<PostReportItem>>(POST_REPORTS.RESOLVE(reportId), {
      status,
    } satisfies ResolvePostReportRequest);

    return extractData(response.data, 'Failed to resolve report');
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountPayload>>(POST_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending report count');
    return payload.pendingCount;
  },
};
