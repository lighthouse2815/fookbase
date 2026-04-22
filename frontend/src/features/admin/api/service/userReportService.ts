import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';
import type { CreateUserReportRequestDto, ResolveUserReportRequestDto } from '@/features/admin/api/dtos/request.dto';
import type {
  PendingCountOptionalResponseDto,
  UserReportListPagedResponseDto,
  UserReportResponseDto,
} from '@/features/admin/api/dtos/response.dto';
import {
  mapOptionalPendingCountResponseDto,
  mapUserReportResponseDto,
  mapUserReportsPaged,
} from '@/features/admin/api/mapper/admin.mapper';
import type {
  ResolveUserReportStatus,
  UserReportItem,
  PaginatedUserReports,
} from '@/features/admin/types/report';
import type { ApiEnvelope } from '@/shared/types/api';

const { USER_REPORTS } = API_ENDPOINTS;

export const userReportService = {
  async create(targetUserId: string, reason: string): Promise<UserReportItem> {
    const response = await apiClient.post<ApiEnvelope<UserReportResponseDto>>(USER_REPORTS.CREATE, {
      targetUserId,
      reason,
    } satisfies CreateUserReportRequestDto);

    return mapUserReportResponseDto(extractData(response.data, 'Failed to report user'));
  },

  async getMine(page: number, pageSize: number): Promise<PaginatedUserReports> {
    const response = await apiClient.get<ApiEnvelope<UserReportListPagedResponseDto>>(USER_REPORTS.MY, {
      params: { page, pageSize },
    });

    return mapUserReportsPaged(extractData(response.data, 'Failed to load user reports'));
  },

  async getAll(page: number, pageSize: number): Promise<PaginatedUserReports> {
    const response = await apiClient.get<ApiEnvelope<UserReportListPagedResponseDto>>(USER_REPORTS.LIST, {
      params: { page, pageSize },
    });

    return mapUserReportsPaged(extractData(response.data, 'Failed to load user reports'));
  },

  async resolve(reportId: string, status: ResolveUserReportStatus): Promise<UserReportItem> {
    const response = await apiClient.patch<ApiEnvelope<UserReportResponseDto>>(USER_REPORTS.RESOLVE(reportId), {
      status,
    } satisfies ResolveUserReportRequestDto);

    return mapUserReportResponseDto(extractData(response.data, 'Failed to resolve user report'));
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiEnvelope<PendingCountOptionalResponseDto>>(USER_REPORTS.PENDING_COUNT);
    const payload = extractData(response.data, 'Failed to load pending user report count');
    return mapOptionalPendingCountResponseDto(payload);
  },
};



