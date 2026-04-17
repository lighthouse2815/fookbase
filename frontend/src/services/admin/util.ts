import type { PagedResult } from '@/interface/api';
import type { AdminAuditLogItem, AdminUserItem, PaginatedAdminAuditLogs } from '@/interface/admin';

export const normalizeAdminUser = (item: AdminUserItem): AdminUserItem => ({
  ...item,
  username: item.username?.trim() || 'user',
  displayName: item.displayName?.trim() || item.username?.trim() || 'user',
  role: item.role?.trim().toUpperCase() || 'USER',
  status: item.status?.trim().toUpperCase() || 'INACTIVE',
  avatarUrl: item.avatarUrl || `https://i.pravatar.cc/150?u=${item.userId}`,
});

export const mapPagedAuditLogs = (paged: PagedResult<AdminAuditLogItem>): PaginatedAdminAuditLogs => {
  const loadedCount = paged.page * paged.pageSize;
  return {
    items: paged.items,
    page: paged.page,
    pageSize: paged.pageSize,
    hasMore: loadedCount < paged.totalCount,
  };
};
