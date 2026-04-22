import type { PaginatedResult } from '@/shared/types/api';
import type {
  Comment as PostComment,
  CommentReactionFriendshipStatus as PostCommentReactionFriendshipStatus,
  CommentReactionType as PostCommentReactionType,
  CommentReactionUser as PostCommentReactionUser,
  CommentReactionUsersResponse as PostCommentReactionUsersResponse,
} from '@/features/post/types/contracts';

export type CommentReactionType = PostCommentReactionType;
export type CommentReactionFriendshipStatus = PostCommentReactionFriendshipStatus;
export type Comment = PostComment;
export type CommentReactionUser = PostCommentReactionUser;
export type CommentReactionUsersResponse = PostCommentReactionUsersResponse;

export interface CommentReactionState {
  commentId: string;
  reactionType: CommentReactionType | null;
}

export type PaginatedComments = PaginatedResult<Comment>;

export type CommentReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface CommentReportUserSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface CommentReportItem {
  id: string;
  commentId: string;
  postId: string;
  reportedByUserId: string;
  commentOwnerUserId?: string | null;
  reason: string;
  status: CommentReportStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: CommentReportUserSummary | null;
  commentOwner?: CommentReportUserSummary | null;
}
