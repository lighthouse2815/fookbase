import type { Comment } from '@/features/comment/types/contracts';

import { normalizeId } from '@/features/comment/utils/comment.util';

interface CommentPermissionContext {
  currentUserId: string;
  postAuthorId: string;
}

const isPostOwner = ({ currentUserId, postAuthorId }: CommentPermissionContext) => {
  return normalizeId(currentUserId) === normalizeId(postAuthorId);
};

const isCommentOwner = (comment: Comment, currentUserId: string) => {
  return normalizeId(comment.author.id) === normalizeId(currentUserId);
};

export const canEditComment = (comment: Comment, context: CommentPermissionContext) => {
  return !isPostOwner(context) && isCommentOwner(comment, context.currentUserId);
};

export const canDeleteComment = (comment: Comment, context: CommentPermissionContext) => {
  return isCommentOwner(comment, context.currentUserId);
};

export const canReportComment = (comment: Comment, context: CommentPermissionContext) => {
  return isPostOwner(context) || !isCommentOwner(comment, context.currentUserId);
};
