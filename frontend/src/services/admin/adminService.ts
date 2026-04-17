import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractData } from '@/services/util';
import type { ApiEnvelope, PagedResult } from '@/interface/api';

const { ADMIN } = API_CONFIG.ENDPOINTS;

export interface AdminUserItem {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  role: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AdminMonthlyMetric {
  month: string;
  users: number;
  posts: number;
}

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  inactiveUsers: number;
  totalPosts: number;
  pendingPostReports: number;
  pendingUserReports: number;
  pendingStoryReports: number;
  monthlyMetrics: AdminMonthlyMetric[];
}

export interface AdminAuditLogItem {
  id: string;
  adminUserId: string;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  targetUserId?: string | null;
  details?: string | null;
  createdAt: string;
}

export interface PaginatedAdminAuditLogs {
  items: AdminAuditLogItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const normalizeAdminUser = (item: AdminUserItem): AdminUserItem => ({
  ...item,
  username: item.username?.trim() || 'user',
  displayName: item.displayName?.trim() || item.username?.trim() || 'user',
  role: item.role?.trim().toUpperCase() || 'USER',
  status: item.status?.trim().toUpperCase() || 'INACTIVE',
  avatarUrl: item.avatarUrl || `https://i.pravatar.cc/150?u=${item.userId}`,
});

const mapPagedAuditLogs = (paged: PagedResult<AdminAuditLogItem>): PaginatedAdminAuditLogs => {
  const loadedCount = paged.page * paged.pageSize;
  return {
    items: paged.items,
    page: paged.page,
    pageSize: paged.pageSize,
    hasMore: loadedCount < paged.totalCount,
  };
};

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
