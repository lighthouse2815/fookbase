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
  status: string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: ReportUserSummary | null;
  postOwner?: ReportUserSummary | null;
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
