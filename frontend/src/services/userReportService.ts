import { apiClient } from './apiClient';
import type { UserReportItem } from '../types/report';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  errors?: string[];
}

interface PagedResult<T> {
  items?: T[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

interface CreateUserReportRequest {
  targetUserId: string;
  reason: string;
}

interface ResolveUserReportRequest {
  status: 'RESOLVED' | 'REJECTED';
}

interface PendingCountPayload {
  pendingCount?: number;
}

export interface PaginatedUserReports {
  items: UserReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

const extractData = <T>(payload: ApiEnvelope<T>, fallbackMessage: string): T => {
  if (payload.data === undefined || payload.data === null) {
    throw new Error(payload.errors?.[0] ?? fallbackMessage);
  }

  return payload.data;
};

const mapPaged = (paged: PagedResult<UserReportItem>): PaginatedUserReports => {
  const page = paged.page ?? 1;
  const pageSize = paged.pageSize ?? paged.items?.length ?? 0;
  const totalCount = paged.totalCount ?? paged.items?.length ?? 0;
  const totalPages = paged.totalPages ?? (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1);

  return {
    items: paged.items ?? [],
    page,
    pageSize,
    totalCount,
    totalPages,
    hasMore: paged.hasNextPage ?? page < totalPages,
  };
};

export const userReportService = {
  async create(targetUserId: string, reason: string): Promise<UserReportItem> {
    const response = await apiClient.post<ApiEnvelope<UserReportItem>>('/api/user-reports', {
      targetUserId,
      reason,
    } satisfies CreateUserReportRequest);

    return extractData(response.data, 'Failed to report user');
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedUserReports> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<UserReportItem>>>('/api/user-reports/my', {
      params: { page, pageSize },
    });

    return mapPaged(extractData(response.data, 'Failed to load user reports'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedUserReports> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<UserReportItem>>>('/api/user-reports', {
      params: { page, pageSize },
    });

    return mapPaged(extractData(response.data, 'Failed to load user reports'));
  },

  async resolve(reportId: string, status: ResolveUserReportRequest['status']): Promise<UserReportItem> {
    const response = await apiClient.patch<ApiEnvelope<UserReportItem>>(`/api/user-reports/${reportId}/resolve`, {
      status,
    } satisfies ResolveUserReportRequest);

    return extractData(response.data, 'Failed to resolve user report');
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountPayload>>('/api/user-reports/pending-count');
    const payload = extractData(response.data, 'Failed to load pending user report count');
    return payload.pendingCount ?? 0;
  },
};
