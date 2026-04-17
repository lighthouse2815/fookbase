import type { UserReportItem } from '@/interface/report';

/** API may return sparse pagination fields for user reports. */
export interface UserReportListPagedPayload {
  items?: UserReportItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface UserProfilePresencePayload {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string | null;
}
