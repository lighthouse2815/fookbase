export interface PostReportItem {
  id: string;
  postId: string;
  reportedByUserId: string;
  reason: string;
  status: PostReportStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface CreatePostReportRequest {
  postId: string;
  reason: string;
}

export interface ResolvePostReportRequest {
  status: PostReportStatus;
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

export interface CreateCommentReportRequest {
  commentId: string;
  reason: string;
}

export interface ResolveCommentReportRequest {
  status: PostReportStatus;
}

export interface PendingCountPayload {
  pendingCount: number;
}

export interface ReportUserSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface UserReportItem {
  id: string;
  targetUserId: string;
  reportedByUserId: string;
  reason: string;
  status: string;
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
  status: string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummary | null;
  storyOwner?: ReportUserSummary | null;
}

export interface ResolveStoryReportRequest {
  status: 'RESOLVED' | 'REJECTED';
}

export interface ResolveUserReportRequest {
  status: 'RESOLVED' | 'REJECTED';
}

export interface CreateUserReportRequest {
  targetUserId: string;
  reason: string;
}

export interface PaginatedUserReports {
  items: UserReportItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PendingCountPayloadOptional {
  pendingCount?: number;
}
