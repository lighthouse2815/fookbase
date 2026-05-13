import type { Post, SharedPostReference } from '@/features/post/types/contracts';
import type { PostResponseDto } from '@/features/post/api/dtos/response.dto';
import { ENV } from '@/shared/env/env';
import { parseReactionType, parseReactionTypes } from '@/features/comment/utils/reaction.util';
import type { PostReactionType } from '@/features/post/types/contracts';
import { parsePostVisibility } from '@/features/post/utils/visibility';

const resolvePostMediaUrl = (mediaUrl: string): string => {
  const normalized = mediaUrl.trim();
  if (!normalized) {
    return normalized;
  }

  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }

  const baseUrl = ENV.API_BASE_URL;
  if (!baseUrl) {
    return normalized;
  }

  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return normalized;
  }
};

export const mapPost = (payload: PostResponseDto): Post => {
  const authorName = payload.author?.displayName?.trim() || payload.author?.username?.trim() || 'user';
  const authorId = payload.author?.id || payload.userId;
  const username = payload.author?.username?.trim() || 'user';
  const reactionCount = typeof payload.reactionCount === 'number'
    ? Math.max(0, payload.reactionCount)
    : Math.max(0, payload.likeCount ?? 0);
  const currentUserReactionType = parseReactionType(payload.currentUserReactionType);
  const resolvedTopReactionTypes = parseReactionTypes(payload.topReactionTypes);
  const topReactionTypes = resolvedTopReactionTypes.length > 0
    ? resolvedTopReactionTypes
    : reactionCount > 0
      ? (['LIKE'] as PostReactionType[])
      : [];

  const payloadImageUrls = Array.isArray(payload.imageUrls)
    ? payload.imageUrls
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
        .map(resolvePostMediaUrl)
    : [];
  const sharedOriginalPost = mapSharedOriginalPost(payload);

  return {
    id: payload.id,
    author: {
      id: authorId,
      username,
      fullName: authorName,
      avatarUrl: payload.author?.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    },
    content: payload.content,
    visibility: parsePostVisibility(payload.visibility),
    imageUrls: payloadImageUrls,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt ?? payload.createdAt,
    likes: reactionCount,
    likedByCurrentUser: payload.likedByCurrentUser ?? Boolean(currentUserReactionType),
    reactionCount,
    currentUserReactionType,
    topReactionTypes,
    commentCount: payload.commentCount,
    shareCount: typeof payload.shareCount === 'number' ? Math.max(0, payload.shareCount) : 0,
    originalPost: sharedOriginalPost,
    comments: [],
  };
};

const mapSharedOriginalPost = (payload: PostResponseDto): SharedPostReference | null => {
  if (!payload.originalPost) {
    return null;
  }

  const original = payload.originalPost;
  const authorName = original.author?.displayName?.trim() || original.author?.username?.trim() || 'user';
  const authorId = original.author?.id || original.userId;
  const username = original.author?.username?.trim() || 'user';
  const originalImageUrls = Array.isArray(original.imageUrls)
    ? original.imageUrls
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
        .map(resolvePostMediaUrl)
    : [];

  return {
    id: original.id,
    author: {
      id: authorId,
      username,
      fullName: authorName,
      avatarUrl: original.author?.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    },
    content: original.content,
    imageUrls: originalImageUrls,
    createdAt: original.createdAt,
    reactionCount: typeof original.reactionCount === 'number' ? Math.max(0, original.reactionCount) : 0,
    commentCount: typeof original.commentCount === 'number' ? Math.max(0, original.commentCount) : 0,
  };
};


