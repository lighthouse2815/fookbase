import type { User } from '@/interface/user';
import type { PaginatedUserReports } from '@/interface/report';
import type { UserProfilePresencePayload, UserReportListPagedPayload } from '@/services/user/interface';

export const mapPresenceToUser = (payload: UserProfilePresencePayload): User => {
  const id = payload.userId;
  const displayName = payload.displayName?.trim() || 'user';

  return {
    id,
    username: displayName,
    fullName: displayName,
    avatarUrl: payload.avatarUrl?.trim() || `https://i.pravatar.cc/150?u=${id}`,
    isOnline: payload.isOnline,
    lastSeenAt: payload.lastSeenAt ?? undefined,
  };
};

export const mapUserReportsPaged = (paged: UserReportListPagedPayload): PaginatedUserReports => {
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
