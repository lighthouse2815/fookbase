import type { CommentReportStatus, CommentReactionType } from '@/features/comment/types/contracts';

export interface CreateCommentRequestDto {
  postId: string;
  content: string;
  parentCommentId: string | null;
}

export interface UpdateCommentRequestDto {
  content: string;
}

export interface SetCommentReactionRequestDto {
  type: CommentReactionType;
}

export interface CreateCommentReportRequestDto {
  commentId: string;
  reason: string;
}

export interface ResolveCommentReportRequestDto {
  status: CommentReportStatus;
}
