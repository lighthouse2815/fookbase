import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
import { mapPagedAuditLogs, normalizeAdminUser } from '@/services/admin/util';
import type { ApiEnvelope, PagedResult } from '@/interface/api';
import type {
  AdminAuditLogItem,
  AdminDashboard,
  AdminUserItem,
  PaginatedAdminAuditLogs,
} from '@/interface/admin';

const { ADMIN } = API_CONFIG.ENDPOINTS;

export const adminService = {
  async searchUsers(keyword?: string): Promise<AdminUserItem[]> {
    const response = await apiClient.get<ApiEnvelope<AdminUserItem[]>>(ADMIN.USERS_SEARCH, {
      params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
    });
    const users = extractData(response.data, 'Failed to search users');
    return users.map(normalizeAdminUser);
  },

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'BANNED' | 'INACTIVE'): Promise<AdminUserItem> {
    const response = await apiClient.patch<ApiEnvelope<AdminUserItem>>(ADMIN.USER_STATUS(userId), { status });
    return normalizeAdminUser(extractData(response.data, 'Failed to update user status'));
  },

  async getDashboard(): Promise<AdminDashboard> {
    const response = await apiClient.get<ApiEnvelope<AdminDashboard>>(ADMIN.DASHBOARD);
    const dashboard = extractData(response.data, 'Failed to load admin dashboard');

    return {
      ...dashboard,
      totalUsers: Number(dashboard.totalUsers ?? 0),
      activeUsers: Number(dashboard.activeUsers ?? 0),
      bannedUsers: Number(dashboard.bannedUsers ?? 0),
      inactiveUsers: Number(dashboard.inactiveUsers ?? 0),
      totalPosts: Number(dashboard.totalPosts ?? 0),
      pendingPostReports: Number(dashboard.pendingPostReports ?? 0),
      pendingCommentReports: Number(dashboard.pendingCommentReports ?? 0),
      pendingUserReports: Number(dashboard.pendingUserReports ?? 0),
      pendingStoryReports: Number(dashboard.pendingStoryReports ?? 0),
      monthlyMetrics: (dashboard.monthlyMetrics ?? []).map((item) => ({
        month: item.month,
        users: Number(item.users ?? 0),
        posts: Number(item.posts ?? 0),
      })),
    };
  },

  async getAuditLogs(page: number, pageSize: number): Promise<PaginatedAdminAuditLogs> {
    const response = await apiClient.get<ApiEnvelope<PagedResult<AdminAuditLogItem>>>(ADMIN.AUDIT_LOGS, {
      params: { page, pageSize },
    });
    return mapPagedAuditLogs(extractData(response.data, 'Failed to load admin audit logs'));
  },
};
