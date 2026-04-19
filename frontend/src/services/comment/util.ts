import type { CommentPayload } from "@/interface/comment";
import type { 
  CommentReactionUserPayload, 
  Comment, 
  CommentReactionType, 
  CommentReactionUser 
} from '@/interface/post';

export const mapComment = (payload: CommentPayload): Comment => {
  const authorName = payload.author?.displayName?.trim() || 'user';
  const authorId = payload.author?.id || payload.userId;
  const mappedReplies = Array.isArray(payload.replies)
    ? payload.replies.map((reply) => mapComment(reply))
    : [];

  return {
    id: payload.id,
    parentCommentId: payload.parentCommentId ?? null,
    author: {
      id: authorId,
      username: 'user',
      fullName: authorName,
      avatarUrl: payload.author?.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    },
    content: payload.content,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    currentUserReactionType: parseReactionType(payload.currentUserReactionType),
    reactionCount: typeof payload.reactionCount === 'number' ? Math.max(0, payload.reactionCount) : 0,
    topReactionTypes: parseReactionTypes(payload.topReactionTypes),
    replyCount: typeof payload.replyCount === 'number'
      ? Math.max(0, payload.replyCount)
      : mappedReplies.length,
    replies: mappedReplies,
  };
};

export  const parseReactionType = (value?: string | null): CommentReactionType | null => {
    if (!value) {
      return null;
    }
  
    const normalized = value.trim().toUpperCase();
    const allowedReactionTypes: CommentReactionType[] = ['LIKE', 'WOW', 'SAD', 'ANGRY', 'HAHA', 'LOVE'];
    return allowedReactionTypes.includes(normalized as CommentReactionType)
      ? (normalized as CommentReactionType)
      : null;
  };
  
export  const parseReactionTypes = (values?: string[] | null): CommentReactionType[] => {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }
  
    const mapped = values
      .map((value) => parseReactionType(value))
      .filter((value): value is CommentReactionType => Boolean(value));
  
    return Array.from(new Set(mapped)).slice(0, 3);
  };

export  const mapReactionUser = (payload: CommentReactionUserPayload): CommentReactionUser | null => {
    const parsedReactionType = parseReactionType(payload.reactionType);
    if (!parsedReactionType) {
      return null;
    }
  
    const normalizedUserId = payload.userId?.trim();
    if (!normalizedUserId) {
      return null;
    }
  
    return {
      userId: normalizedUserId,
      displayName: payload.displayName?.trim() || 'user',
      avatarUrl: payload.avatarUrl?.trim() || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
      reactionType: parsedReactionType,
      reactedAt: payload.reactedAt ?? new Date().toISOString(),
    };
  };