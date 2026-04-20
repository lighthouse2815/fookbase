import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData, mapPaged } from '@/services/util';
import type {
  CreateCommentReportRequest,
  ResolveCommentReportRequest,
  PendingCountPayload,
  CommentReportItem,
} from '@/interface/report';
import type { PagedResult, ApiEnvelope, PaginatedResult } from '@/interface/api';

const { COMMENT_REPORTS } = API_CONFIG.ENDPOINTS;

export const commentReportService = {
  async create(commentId: string, reason: string): Promise<CommentReportItem> {
    const response = await apiClient.post<ApiEnvelope<CommentReportItem>>(COMMENT_REPORTS.CREATE, {
      commentId,
      reason,
    } satisfies CreateCommentReportRequest);

    return extractData(response.data, 'Failed to report comment');
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedResult<CommentReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<CommentReportItem>>>(COMMENT_REPORTS.MY, {
      params: {
        page,
        pageSize,
      },
    });

    return mapPaged(extractData(response.data, 'Failed to load comment reports'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedResult<CommentReportItem>> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<CommentReportItem>>>(COMMENT_REPORTS.LIST, {
      params: {
        page,
        pageSize,
      },
    });

    return mapPaged(extractData(response.data, 'Failed to load comment reports'));
  },

  async resolve(reportId: string, status: ResolveCommentReportRequest['status']): Promise<CommentReportItem> {
    const response = await apiClient.patch<ApiEnvelope<CommentReportItem>>(COMMENT_REPORTS.RESOLVE(reportId), {
      status,
    } satisfies ResolveCommentReportRequest);

    return extractData(response.data, 'Failed to resolve comment report');
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountPayload>>(COMMENT_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending comment report count');
    return payload.pendingCount;
  },
};
