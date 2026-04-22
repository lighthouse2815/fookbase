export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export type PostReportStatus = ReportStatus;
export type StoryReportStatus = ReportStatus;
export type UserReportStatus = ReportStatus;
export type ResolveStoryReportStatus = 'RESOLVED' | 'REJECTED';
export type ResolveUserReportStatus = 'RESOLVED' | 'REJECTED';

export interface ReportUserSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface PostReportItem {
  id: string;
  postId: string;
  reportedByUserId: string;
  postOwnerUserId?: string | null;
  reason: string;
  status: PostReportStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummary | null;
  postOwner?: ReportUserSummary | null;
}

export interface CommentReportItem {
  id: string;
  commentId: string;
  postId: string;
  reportedByUserId: string;
  commentOwnerUserId?: string | null;
  reason: string;
  status: PostReportStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummary | null;
  commentOwner?: ReportUserSummary | null;
}

export interface UserReportItem {
  id: string;
  targetUserId: string;
  reportedByUserId: string;
  reason: string;
  status: UserReportStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummary | null;
  targetUser?: ReportUserSummary | null;
}

export interface StoryReportItem {
  id: string;
  storyId: string;
  storyOwnerUserId?: string | null;
  reportedByUserId: string;
  reason: string;
  status: StoryReportStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummary | null;
  storyOwner?: ReportUserSummary | null;
}

export interface PaginatedUserReports {
  items: UserReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}
