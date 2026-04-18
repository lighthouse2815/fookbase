import type { Comment, CommentReactionType } from '@/interface/post';

import type { ReactionFriendState, ReactionOptionBase } from './interface';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_VISUAL_REPLY_LEVEL = 2;
export const REPLY_INDENT_PER_LEVEL_PX = 18;
export const AUTO_EXPAND_ALL_FROM_LEVEL = 3;

export const REACTION_OPTION_BASES: ReactionOptionBase[] = [
  { type: 'LIKE', icon: '\u{1F44D}' },
  { type: 'WOW', icon: '\u{1F62E}' },
  { type: 'SAD', icon: '\u{1F622}' },
  { type: 'ANGRY', icon: '\u{1F621}' },
  { type: 'HAHA', icon: '\u{1F602}' },
  { type: 'LOVE', icon: '\u2764\uFE0F' },
];

export const normalizeId = (value: string) => value.trim().toLowerCase();

export function normalizeCommentTree(comment: Comment): Comment {
  const normalizedReplies = Array.isArray(comment.replies)
    ? comment.replies.map((reply) => normalizeCommentTree(reply))
    : [];

  return {
    ...comment,
    parentCommentId: comment.parentCommentId ?? null,
    replies: normalizedReplies,
    replyCount: typeof comment.replyCount === 'number'
      ? Math.max(0, comment.replyCount)
      : normalizedReplies.length,
  };
}

export function replaceCommentInTree(items: Comment[], updatedComment: Comment): Comment[] {
  return items.map((comment) => {
    if (comment.id === updatedComment.id) {
      return normalizeCommentTree(updatedComment);
    }

    const currentReplies = comment.replies ?? [];
    if (currentReplies.length === 0) {
      return comment;
    }

    const nextReplies = replaceCommentInTree(currentReplies, updatedComment);
    return {
      ...comment,
      replies: nextReplies,
      replyCount: nextReplies.length,
    };
  });
}

export function removeCommentFromTree(items: Comment[], targetCommentId: string): Comment[] {
  return items
    .filter((comment) => comment.id !== targetCommentId)
    .map((comment) => {
      const nextReplies = removeCommentFromTree(comment.replies ?? [], targetCommentId);
      return {
        ...comment,
        replies: nextReplies,
        replyCount: nextReplies.length,
      };
    });
}

export function addReplyToTree(items: Comment[], parentCommentId: string, reply: Comment): Comment[] {
  return items.map((comment) => {
    if (comment.id === parentCommentId) {
      const existingReplies = comment.replies ?? [];
      const nextReplies = [...existingReplies, normalizeCommentTree(reply)];

      return {
        ...comment,
        replies: nextReplies,
        replyCount: nextReplies.length,
      };
    }

    const existingReplies = comment.replies ?? [];
    if (existingReplies.length === 0) {
      return comment;
    }

    const nextReplies = addReplyToTree(existingReplies, parentCommentId, reply);

    return {
      ...comment,
      replies: nextReplies,
      replyCount: nextReplies.length,
    };
  });
}

export function hasCommentInTree(items: Comment[], commentId: string): boolean {
  return items.some((comment) => comment.id === commentId || hasCommentInTree(comment.replies ?? [], commentId));
}

export function countCommentsInTree(comment: Comment): number {
  return 1 + (comment.replies ?? []).reduce((total, reply) => total + countCommentsInTree(reply), 0);
}

export function collectDescendantCommentIds(commentId: string, commentLookupById: Map<string, Comment>): string[] {
  const root = commentLookupById.get(commentId);
  if (!root) {
    return [];
  }

  const ids: string[] = [];
  const stack: Comment[] = [...(root.replies ?? [])];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    ids.push(current.id);
    if (current.replies && current.replies.length > 0) {
      stack.push(...current.replies);
    }
  }

  return ids;
}

export function isCommentEdited(comment: Comment): boolean {
  if (!comment.updatedAt) {
    return false;
  }

  const createdAtMs = Date.parse(comment.createdAt);
  const updatedAtMs = Date.parse(comment.updatedAt);
  if (!Number.isFinite(createdAtMs) || !Number.isFinite(updatedAtMs)) {
    return false;
  }

  return updatedAtMs > createdAtMs + 1000;
}

export function getReactionButtonToneClass(reactionType?: CommentReactionType | null): string {
  if (!reactionType) {
    return 'text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200';
  }

  if (reactionType === 'LIKE') {
    return 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/40';
  }

  if (reactionType === 'ANGRY' || reactionType === 'LOVE') {
    return 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/40';
  }

  return 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/40';
}

export function buildReactionFriendStateLookup(
  friendsIds: string[],
  receivedRequests: Array<{ id: string; requestId: string }>,
  sentRequests: Array<{ id: string; requestId: string }>,
): Record<string, ReactionFriendState> {
  const states: Record<string, ReactionFriendState> = {};

  friendsIds.forEach((id) => {
    states[normalizeId(id)] = { status: 'FRIEND' };
  });

  sentRequests.forEach((request) => {
    const key = normalizeId(request.id);
    if (states[key]?.status === 'FRIEND') {
      return;
    }

    states[key] = {
      status: 'REQUEST_SENT',
      requestId: request.requestId,
    };
  });

  receivedRequests.forEach((request) => {
    const key = normalizeId(request.id);
    if (states[key]) {
      return;
    }

    states[key] = {
      status: 'REQUEST_RECEIVED',
      requestId: request.requestId,
    };
  });

  return states;
}
