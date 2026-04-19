import type { PostPayload } from "@/interface/post";
import type { Post } from "@/interface/post";
import { parseReactionType, parseReactionTypes } from "../comment/util";
import type { PostReactionType } from '@/type/post.type';

export const mapPost = (payload: PostPayload): Post => {
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
    : [];

  return {
    id: payload.id,
    author: {
      id: authorId,
      username,
      fullName: authorName,
      avatarUrl: payload.author?.avatarUrl || `https://i.pravatar.cc/150?u=${authorId}`,
    },
    content: payload.content,
    imageUrls: payloadImageUrls,
    createdAt: payload.createdAt,
    likes: reactionCount,
    likedByCurrentUser: payload.likedByCurrentUser ?? Boolean(currentUserReactionType),
    reactionCount,
    currentUserReactionType,
    topReactionTypes,
    commentCount: payload.commentCount,
    comments: [],
  };
};
