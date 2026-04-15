export interface PostReportItem {
  id: string;
  postId: string;
  reportedByUserId: string;
  reason: string;
  status: string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
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
}
