export interface CommentAuthorResponseDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface CommentResponseDto {
  id: string;
  postId: string;
  parentCommentId?: string | null;
  userId: string;
  author?: CommentAuthorResponseDto;
  content: string;
  createdAt: string;
  updatedAt: string;
  currentUserReactionType?: string | null;
  reactionCount?: number;
  topReactionTypes?: string[] | null;
  replyCount?: number;
  replies?: CommentResponseDto[] | null;
}

export interface CommentReactionStateResponseDto {
  commentId: string;
  reactionType?: string | null;
}

export interface CommentReactionUserResponseDto {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reactionType?: string | null;
  reactedAt?: string;
}

export interface CommentReactionUsersResponseDto {
  commentId: string;
  totalCount?: number;
  users?: CommentReactionUserResponseDto[] | null;
}

export interface CommentReportUserSummaryResponseDto {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface CommentReportResponseDto {
  id: string;
  commentId: string;
  postId: string;
  reportedByUserId: string;
  commentOwnerUserId?: string | null;
  reason: string;
  status: string;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: CommentReportUserSummaryResponseDto | null;
  commentOwner?: CommentReportUserSummaryResponseDto | null;
}

export interface PendingCountResponseDto {
  pendingCount: number;
}
