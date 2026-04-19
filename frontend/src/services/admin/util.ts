import type { PagedResult } from '@/interface/api';
import type { AdminAuditLogItem, AdminUserItem, PaginatedAdminAuditLogs } from '@/interface/admin';

export const normalizeAdminUser = (item: AdminUserItem): AdminUserItem => ({
  ...item,
  username: item.username?.trim() || 'user',
  displayName: item.displayName?.trim() || item.username?.trim() || 'user',
  role: item.role?.trim().toUpperCase() || 'USER',
  status: item.status?.trim().toUpperCase() || 'INACTIVE',
  avatarUrl: item.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
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
