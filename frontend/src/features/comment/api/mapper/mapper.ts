import type {
  CommentReactionState,
  CommentReactionUser,
  CommentReactionUsersResponse,
  CommentReportItem,
} from '@/features/comment/types/contracts';
import type {
  CommentReactionStateResponseDto,
  CommentReactionUsersResponseDto,
  CommentResponseDto,
  CommentReportResponseDto,
  PendingCountResponseDto,
} from '@/features/comment/api/dtos/response.dto';
import type { Comment } from '@/features/comment/types/contracts';
import { mapReactionUser, parseReactionType, parseReactionTypes } from '@/features/comment/utils/reaction.util';

export const mapCommentResponseDtoToComment = (payload: CommentResponseDto): Comment => {
  const authorName = payload.author?.displayName?.trim() || 'user';
  const authorId = payload.author?.id || payload.userId;
  const mappedReplies = Array.isArray(payload.replies)
    ? payload.replies.map((reply) => mapCommentResponseDtoToComment(reply))
    : [];

  return {
    id: payload.id,
    parentCommentId: payload.parentCommentId ?? null,
    author: {
      id: authorId,
      username: 'user',
      fullName: authorName,
      avatarUrl:
        payload.author?.avatarUrl ||
        'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    },
    content: payload.content,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    currentUserReactionType: parseReactionType(payload.currentUserReactionType),
    reactionCount: typeof payload.reactionCount === 'number' ? Math.max(0, payload.reactionCount) : 0,
    topReactionTypes: parseReactionTypes(payload.topReactionTypes),
    replyCount: typeof payload.replyCount === 'number' ? Math.max(0, payload.replyCount) : mappedReplies.length,
    replies: mappedReplies,
  };
};

export const mapCommentReactionStateResponseDto = (
  payload: CommentReactionStateResponseDto,
): CommentReactionState => {
  return {
    commentId: payload.commentId,
    reactionType: parseReactionType(payload.reactionType),
  };
};

export const mapCommentReactionUsersResponseDto = (
  payload: CommentReactionUsersResponseDto,
): CommentReactionUsersResponse => {
  const users = Array.isArray(payload.users)
    ? payload.users.map(mapReactionUser).filter((item): item is CommentReactionUser => Boolean(item))
    : [];

  return {
    commentId: payload.commentId,
    totalCount: typeof payload.totalCount === 'number' ? Math.max(0, payload.totalCount) : users.length,
    users,
  };
};

export const mapCommentReportResponseDto = (payload: CommentReportResponseDto): CommentReportItem => {
  const normalizedStatus = payload.status?.trim().toUpperCase();

  return {
    ...payload,
    status:
      normalizedStatus === 'PENDING' || normalizedStatus === 'RESOLVED' || normalizedStatus === 'REJECTED'
        ? normalizedStatus
        : 'PENDING',
  };
};

export const mapPendingCountResponseDto = (payload: PendingCountResponseDto): number => {
  return typeof payload.pendingCount === 'number' ? Math.max(0, payload.pendingCount) : 0;
};
