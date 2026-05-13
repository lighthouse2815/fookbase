import type { AdminReportStatusRequest } from '@/features/admin/api/dtos/request.dto';

export interface ReportUserSummaryResponseDto {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface PostReportResponseDto {
  id: string;
  postId: string;
  reportedByUserId: string;
  postOwnerUserId?: string | null;
  reason: string;
  status: AdminReportStatusRequest | string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummaryResponseDto | null;
  postOwner?: ReportUserSummaryResponseDto | null;
}

export interface UserReportResponseDto {
  id: string;
  targetUserId: string;
  reportedByUserId: string;
  reason: string;
  status: AdminReportStatusRequest | string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummaryResponseDto | null;
  targetUser?: ReportUserSummaryResponseDto | null;
}

export interface StoryReportResponseDto {
  id: string;
  storyId: string;
  storyOwnerUserId?: string | null;
  reportedByUserId: string;
  reason: string;
  status: AdminReportStatusRequest | string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummaryResponseDto | null;
  storyOwner?: ReportUserSummaryResponseDto | null;
}

export interface PendingCountResponseDto {
  pendingCount: number;
}

export interface PendingCountOptionalResponseDto {
  pendingCount?: number;
}

/** API may return sparse pagination fields for user reports. */
export interface UserReportListPagedResponseDto {
  items?: UserReportResponseDto[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface AdminUserResponseDto {
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

export interface AdminMonthlyMetricResponseDto {
  month: string;
  users?: number | string | null;
  posts?: number | string | null;
}

export interface AdminDashboardResponseDto {
  totalUsers?: number | string | null;
  activeUsers?: number | string | null;
  bannedUsers?: number | string | null;
  inactiveUsers?: number | string | null;
  totalPosts?: number | string | null;
  pendingPostReports?: number | string | null;
  pendingCommentReports?: number | string | null;
  pendingUserReports?: number | string | null;
  pendingStoryReports?: number | string | null;
  monthlyMetrics?: AdminMonthlyMetricResponseDto[] | null;
}

export interface AdminAuditLogResponseDto {
  id: string;
  adminUserId: string;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  targetUserId?: string | null;
  details?: string | null;
  createdAt: string;
  admin?: ReportUserSummaryResponseDto | null;
  targetUser?: ReportUserSummaryResponseDto | null;
}

export type PostReportPayload = PostReportResponseDto;
export type UserReportPayload = UserReportResponseDto;
export type StoryReportPayload = StoryReportResponseDto;
export type PendingCountPayload = PendingCountResponseDto;
export type PendingCountOptionalPayload = PendingCountOptionalResponseDto;
export type UserReportListPagedPayload = UserReportListPagedResponseDto;
export type AdminUserPayload = AdminUserResponseDto;
export type AdminDashboardPayload = AdminDashboardResponseDto;
export type AdminAuditLogPayload = AdminAuditLogResponseDto;
