import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';
import type { UpdateAdminUserStatusRequestDto } from '@/features/admin/api/dtos/request.dto';
import type {
  AdminAuditLogResponseDto,
  AdminDashboardResponseDto,
  AdminHashtagOverviewResponseDto,
  AdminUserResponseDto,
} from '@/features/admin/api/dtos/response.dto';
import {
  mapAdminDashboardResponseDto,
  mapAdminHashtagOverviewResponseDto,
  mapAdminUserResponseDto,
  mapPagedAuditLogs,
} from '@/features/admin/api/mapper/admin.mapper';
import type { ApiEnvelope, PagedResult } from '@/shared/types/api';
import type {
  AdminDashboard,
  AdminHashtagOverview,
  AdminUserItem,
  PaginatedAdminAuditLogs,
} from '@/features/admin/types/admin';

const { ADMIN } = API_ENDPOINTS;

export const adminService = {
  async searchUsers(keyword?: string): Promise<AdminUserItem[]> {
    const response = await apiClient.get<ApiEnvelope<AdminUserResponseDto[]>>(ADMIN.USERS_SEARCH, {
      params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
    });
    const users = extractData(response.data, 'Failed to search users');
    return users.map(mapAdminUserResponseDto);
  },

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'BANNED' | 'INACTIVE'): Promise<AdminUserItem> {
    const response = await apiClient.patch<ApiEnvelope<AdminUserResponseDto>>(ADMIN.USER_STATUS(userId), {
      status,
    } satisfies UpdateAdminUserStatusRequestDto);
    return mapAdminUserResponseDto(extractData(response.data, 'Failed to update user status'));
  },

  async getDashboard(): Promise<AdminDashboard> {
    const response = await apiClient.get<ApiEnvelope<AdminDashboardResponseDto>>(ADMIN.DASHBOARD);
    const dashboard = extractData(response.data, 'Failed to load admin dashboard');
    return mapAdminDashboardResponseDto(dashboard);
  },

  async getAuditLogs(page: number, pageSize: number): Promise<PaginatedAdminAuditLogs> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<AdminAuditLogResponseDto>>>(ADMIN.AUDIT_LOGS, {
      params: { page, pageSize },
    });
    return mapPagedAuditLogs(extractData(response.data, 'Failed to load admin audit logs'));
  },

  async getHashtagOverview(page: number, pageSize: number): Promise<AdminHashtagOverview> {
    const response = await apiClient.get<ApiEnvelope<AdminHashtagOverviewResponseDto>>(ADMIN.HASHTAGS, {
      params: { page, pageSize },
    });
    const overview = extractData(response.data, 'Failed to load hashtag overview');
    return mapAdminHashtagOverviewResponseDto(overview);
  },
};



