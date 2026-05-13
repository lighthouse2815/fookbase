import type { PagedResult } from '@/shared/types/api';
import type {
  AdminAuditLogResponseDto,
  AdminDashboardResponseDto,
  AdminUserResponseDto,
  PendingCountOptionalResponseDto,
  PendingCountResponseDto,
  PostReportResponseDto,
  ReportUserSummaryResponseDto,
  StoryReportResponseDto,
  UserReportListPagedResponseDto,
  UserReportResponseDto,
} from '@/features/admin/api/dtos/response.dto';
import type {
  AdminAuditLogItem,
  AdminDashboard,
  AdminUserItem,
  PaginatedAdminAuditLogs,
} from '@/features/admin/types/admin';
import type {
  PaginatedUserReports,
  PostReportItem,
  ReportStatus,
  ReportUserSummary,
  StoryReportItem,
  UserReportItem,
} from '@/features/admin/types/report';
import { normalizeAdminUser } from '@/features/admin/utils/user.util';

export { normalizeAdminUser };

const normalizeReportStatus = (value?: string | null): ReportStatus => {
  const normalized = value?.trim().toUpperCase();
  if (normalized === 'RESOLVED' || normalized === 'REJECTED') {
    return normalized;
  }

  return 'PENDING';
};

const mapReportUserSummaryResponseDto = (
  payload?: ReportUserSummaryResponseDto | null,
): ReportUserSummary | null => {
  if (!payload) {
    return null;
  }

  return {
    id: payload.id,
    displayName: payload.displayName,
    avatarUrl: payload.avatarUrl ?? null,
  };
};

export const mapAdminUserResponseDto = (payload: AdminUserResponseDto): AdminUserItem => {
  return normalizeAdminUser({
    userId: payload.userId,
    username: payload.username,
    displayName: payload.displayName,
    avatarUrl: payload.avatarUrl ?? null,
    email: payload.email ?? null,
    phoneNumber: payload.phoneNumber ?? null,
    role: payload.role,
    status: payload.status,
    createdAt: payload.createdAt ?? null,
    updatedAt: payload.updatedAt ?? null,
  });
};

export const mapAdminDashboardResponseDto = (payload: AdminDashboardResponseDto): AdminDashboard => {
  return {
    totalUsers: Number(payload.totalUsers ?? 0),
    activeUsers: Number(payload.activeUsers ?? 0),
    bannedUsers: Number(payload.bannedUsers ?? 0),
    inactiveUsers: Number(payload.inactiveUsers ?? 0),
    totalPosts: Number(payload.totalPosts ?? 0),
    pendingPostReports: Number(payload.pendingPostReports ?? 0),
    pendingCommentReports: Number(payload.pendingCommentReports ?? 0),
    pendingUserReports: Number(payload.pendingUserReports ?? 0),
    pendingStoryReports: Number(payload.pendingStoryReports ?? 0),
    monthlyMetrics: (payload.monthlyMetrics ?? []).map((item) => ({
      month: item.month,
      users: Number(item.users ?? 0),
      posts: Number(item.posts ?? 0),
    })),
  };
};

export const mapAdminAuditLogResponseDto = (payload: AdminAuditLogResponseDto): AdminAuditLogItem => {
  return {
    id: payload.id,
    adminUserId: payload.adminUserId,
    actionType: payload.actionType,
    entityType: payload.entityType,
    entityId: payload.entityId ?? null,
    targetUserId: payload.targetUserId ?? null,
    details: payload.details ?? null,
    createdAt: payload.createdAt,
    admin: mapReportUserSummaryResponseDto(payload.admin),
    targetUser: mapReportUserSummaryResponseDto(payload.targetUser),
  };
};

export const mapPostReportResponseDto = (payload: PostReportResponseDto): PostReportItem => {
  return {
    id: payload.id,
    postId: payload.postId,
    reportedByUserId: payload.reportedByUserId,
    postOwnerUserId: payload.postOwnerUserId ?? null,
    reason: payload.reason,
    status: normalizeReportStatus(payload.status),
    resolvedByUserId: payload.resolvedByUserId ?? null,
    resolvedAt: payload.resolvedAt ?? null,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    reporter: mapReportUserSummaryResponseDto(payload.reporter),
    postOwner: mapReportUserSummaryResponseDto(payload.postOwner),
  };
};

export const mapStoryReportResponseDto = (payload: StoryReportResponseDto): StoryReportItem => {
  return {
    id: payload.id,
    storyId: payload.storyId,
    storyOwnerUserId: payload.storyOwnerUserId ?? null,
    reportedByUserId: payload.reportedByUserId,
    reason: payload.reason,
    status: normalizeReportStatus(payload.status),
    resolvedByUserId: payload.resolvedByUserId ?? null,
    resolvedAt: payload.resolvedAt ?? null,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    reporter: mapReportUserSummaryResponseDto(payload.reporter),
    storyOwner: mapReportUserSummaryResponseDto(payload.storyOwner),
  };
};

export const mapUserReportResponseDto = (payload: UserReportResponseDto): UserReportItem => {
  return {
    id: payload.id,
    targetUserId: payload.targetUserId,
    reportedByUserId: payload.reportedByUserId,
    reason: payload.reason,
    status: normalizeReportStatus(payload.status),
    resolvedByUserId: payload.resolvedByUserId ?? null,
    resolvedAt: payload.resolvedAt ?? null,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    reporter: mapReportUserSummaryResponseDto(payload.reporter),
    targetUser: mapReportUserSummaryResponseDto(payload.targetUser),
  };
};

export const mapPendingCountResponseDto = (payload: PendingCountResponseDto): number => {
  return Number(payload.pendingCount ?? 0);
};

export const mapOptionalPendingCountResponseDto = (payload: PendingCountOptionalResponseDto): number => {
  return Number(payload.pendingCount ?? 0);
};

export const mapPagedAuditLogs = (paged: PagedResult<AdminAuditLogResponseDto>): PaginatedAdminAuditLogs => {
  const loadedCount = paged.page * paged.pageSize;
  return {
    items: paged.items.map(mapAdminAuditLogResponseDto),
    page: paged.page,
    pageSize: paged.pageSize,
    hasMore: loadedCount < paged.totalCount,
  };
};

export const mapUserReportsPaged = (paged: UserReportListPagedResponseDto): PaginatedUserReports => {
  const page = paged.page ?? 1;
  const pageSize = paged.pageSize ?? paged.items?.length ?? 0;
  const totalCount = paged.totalCount ?? paged.items?.length ?? 0;
  const totalPages = paged.totalPages ?? (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1);

  return {
    items: (paged.items ?? []).map(mapUserReportResponseDto),
    page,
    pageSize,
    totalCount,
    totalPages,
    hasMore: paged.hasNextPage ?? page < totalPages,
  };
};
