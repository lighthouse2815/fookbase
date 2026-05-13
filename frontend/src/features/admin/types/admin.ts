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
  pendingCommentReports: number;
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
  admin?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  targetUser?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
}

export interface PaginatedAdminAuditLogs {
  items: AdminAuditLogItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AdminHashtagUsageItem {
  id: string;
  name: string;
  usageCount: number;
  createdAt: string;
}

export interface AdminHashtagOverview {
  currentMonth: string;
  topHashtags: AdminHashtagUsageItem[];
  items: AdminHashtagUsageItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}
