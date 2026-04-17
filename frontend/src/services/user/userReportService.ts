import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
import { mapUserReportsPaged } from '@/services/user/util';
import type {
  UserReportItem,
  ResolveUserReportRequest,
  CreateUserReportRequest,
  PaginatedUserReports,
  PendingCountPayloadOptional,
} from '@/interface/report';
import type { ApiEnvelope } from '@/interface/api';
import type { UserReportListPagedPayload } from '@/services/user/interface';

const { USER_REPORTS } = API_CONFIG.ENDPOINTS;

export const userReportService = {
  async create(targetUserId: string, reason: string): Promise<UserReportItem> {
    const response = await apiClient.post<ApiEnvelope<UserReportItem>>(USER_REPORTS.CREATE, {
      targetUserId,
      reason,
    } satisfies CreateUserReportRequest);

    return extractData(response.data, 'Failed to report user');
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedUserReports> {
    const response = await apiClient.get<ApiEnvelope<UserReportListPagedPayload>>(USER_REPORTS.MY, {
      params: { page, pageSize },
    });

    return mapUserReportsPaged(extractData(response.data, 'Failed to load user reports'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedUserReports> {
    const response = await apiClient.get<ApiEnvelope<UserReportListPagedPayload>>(USER_REPORTS.LIST, {
      params: { page, pageSize },
    });

    return mapUserReportsPaged(extractData(response.data, 'Failed to load user reports'));
  },

  async resolve(reportId: string, status: ResolveUserReportRequest['status']): Promise<UserReportItem> {
    const response = await apiClient.patch<ApiEnvelope<UserReportItem>>(USER_REPORTS.RESOLVE(reportId), {
      status,
    } satisfies ResolveUserReportRequest);

    return extractData(response.data, 'Failed to resolve user report');
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountPayloadOptional>>(USER_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending user report count');
    return payload.pendingCount ?? 0;
  },
};
