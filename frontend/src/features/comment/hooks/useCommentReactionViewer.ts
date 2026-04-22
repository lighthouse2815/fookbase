import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';

import { commentService } from '@/features/comment/api/service/commentService';
import { friendshipService } from '@/features/friendship/api/service/friendshipService';

import type { Comment, CommentReactionType, CommentReactionUser } from '@/features/comment/types/contracts';
import type {
  ReactionFilterTab,
  ReactionFriendActionMeta,
  ReactionFriendState,
  ReactionMeta,
  ReactionViewerTabItem,
} from '@/features/comment/types/components';
import { getApiErrorMessage } from '@/shared/api/error';
import { buildReactionFriendStateLookup, normalizeId } from '@/features/comment/utils/comment.util';

interface UseCommentReactionViewerParams {
  t: TFunction;
  postId: string;
  normalizedCurrentUserId: string;
  reactionOptions: ReactionMeta[];
  onActionToast?: (message: string, type?: 'success' | 'error') => void;
}

const DEFAULT_REACTION_COUNTS: Record<CommentReactionType, number> = {
  LIKE: 0,
  WOW: 0,
  SAD: 0,
  ANGRY: 0,
  HAHA: 0,
  LOVE: 0,
};

export const useCommentReactionViewer = ({
  t,
  postId,
  normalizedCurrentUserId,
  reactionOptions,
  onActionToast,
}: UseCommentReactionViewerParams) => {
  const [reactionViewerComment, setReactionViewerComment] = useState<Comment | null>(null);
  const [reactionViewerUsers, setReactionViewerUsers] = useState<CommentReactionUser[]>([]);
  const [reactionViewerFilter, setReactionViewerFilter] = useState<ReactionFilterTab>('ALL');
  const [reactionViewerError, setReactionViewerError] = useState<string | null>(null);
  const [isReactionViewerLoading, setIsReactionViewerLoading] = useState(false);
  const [isReactionFriendshipLoading, setIsReactionFriendshipLoading] = useState(false);
  const [reactionFriendStatesByUserId, setReactionFriendStatesByUserId] = useState<Record<string, ReactionFriendState>>(
    {},
  );
  const [reactionFriendActionUserId, setReactionFriendActionUserId] = useState<string | null>(null);

  const getReactionFriendState = (userId: string): ReactionFriendState => {
    if (normalizeId(userId) === normalizedCurrentUserId) {
      return { status: 'SELF' };
    }

    return reactionFriendStatesByUserId[normalizeId(userId)] ?? { status: 'NONE' };
  };

  const closeReactionViewer = () => {
    if (reactionFriendActionUserId) {
      return;
    }

    setReactionViewerComment(null);
    setReactionViewerUsers([]);
    setReactionViewerFilter('ALL');
    setReactionViewerError(null);
    setReactionFriendStatesByUserId({});
  };

  const handleOpenReactionViewer = async (comment: Comment, filter: ReactionFilterTab) => {
    setReactionViewerComment(comment);
    setReactionViewerFilter(filter);
    setReactionViewerError(null);
    setIsReactionViewerLoading(true);
    setIsReactionFriendshipLoading(true);
    setReactionFriendStatesByUserId({});

    const [reactionUsersResult, friendsResult, receivedRequestsResult, sentRequestsResult] = await Promise.allSettled([
      commentService.getCommentReactionUsers(comment.id),
      friendshipService.getFriends(),
      friendshipService.getReceivedRequests(),
      friendshipService.getSentRequests(),
    ]);

    if (reactionUsersResult.status === 'fulfilled') {
      setReactionViewerUsers(reactionUsersResult.value.users);
    } else {
      setReactionViewerUsers([]);
      setReactionViewerError(getApiErrorMessage(reactionUsersResult.reason, t('commentSection.reactionViewerLoadError')));
    }

    const friendIds = friendsResult.status === 'fulfilled' ? friendsResult.value.map((friend) => friend.id) : [];
    const receivedRequests = receivedRequestsResult.status === 'fulfilled'
      ? receivedRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
      : [];
    const sentRequests = sentRequestsResult.status === 'fulfilled'
      ? sentRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
      : [];

    setReactionFriendStatesByUserId(buildReactionFriendStateLookup(friendIds, receivedRequests, sentRequests));
    setIsReactionViewerLoading(false);
    setIsReactionFriendshipLoading(false);
  };

  const handleReactionFriendAction = async (user: CommentReactionUser) => {
    if (reactionFriendActionUserId) {
      return;
    }

    const state = getReactionFriendState(user.userId);
    if (state.status === 'SELF' || state.status === 'FRIEND') {
      return;
    }

    setReactionFriendActionUserId(user.userId);
    setReactionViewerError(null);

    try {
      if (state.status === 'NONE') {
        await friendshipService.sendFriendRequest(user.userId);
        setReactionFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: {
            status: 'REQUEST_SENT',
            requestId: user.userId,
          },
        }));
      } else if (state.status === 'REQUEST_SENT') {
        await friendshipService.cancelSentRequest(state.requestId ?? user.userId);
        setReactionFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: { status: 'NONE' },
        }));
      } else if (state.status === 'REQUEST_RECEIVED') {
        await friendshipService.acceptFriendRequest(state.requestId ?? user.userId);
        setReactionFriendStatesByUserId((current) => ({
          ...current,
          [normalizeId(user.userId)]: { status: 'FRIEND' },
        }));
      }
    } catch (actionError) {
      const message = getApiErrorMessage(actionError, t('commentSection.friendStatusUpdateError'));
      setReactionViewerError(message);
      onActionToast?.(message, 'error');
    } finally {
      setReactionFriendActionUserId(null);
    }
  };

  const reactionViewerTabs = useMemo<ReactionViewerTabItem[]>(() => {
    const countsByType = reactionViewerUsers.reduce<Record<CommentReactionType, number>>(
      (accumulator, user) => {
        accumulator[user.reactionType] = (accumulator[user.reactionType] ?? 0) + 1;
        return accumulator;
      },
      { ...DEFAULT_REACTION_COUNTS },
    );

    return [
      {
        type: 'ALL',
        label: t('commentSection.reactionFilterAll'),
        count: reactionViewerUsers.length,
      },
      ...reactionOptions.filter((reaction) => countsByType[reaction.type] > 0).map((reaction) => ({
        type: reaction.type as ReactionFilterTab,
        label: reaction.icon,
        count: countsByType[reaction.type],
      })),
    ];
  }, [reactionOptions, reactionViewerUsers, t]);

  const filteredReactionViewerUsers = useMemo(() => {
    if (reactionViewerFilter === 'ALL') {
      return reactionViewerUsers;
    }

    return reactionViewerUsers.filter((user) => user.reactionType === reactionViewerFilter);
  }, [reactionViewerFilter, reactionViewerUsers]);

  useEffect(() => {
    if (reactionViewerFilter === 'ALL') {
      return;
    }

    const hasAtLeastOneMatchingReaction = reactionViewerUsers.some((user) => user.reactionType === reactionViewerFilter);
    if (!hasAtLeastOneMatchingReaction) {
      setReactionViewerFilter('ALL');
    }
  }, [reactionViewerFilter, reactionViewerUsers]);

  useEffect(() => {
    setReactionViewerComment(null);
    setReactionViewerUsers([]);
    setReactionViewerFilter('ALL');
    setReactionViewerError(null);
    setReactionFriendStatesByUserId({});
    setReactionFriendActionUserId(null);
    setIsReactionViewerLoading(false);
    setIsReactionFriendshipLoading(false);
  }, [postId]);

  const getReactionFriendActionMeta = (userId: string): ReactionFriendActionMeta | null => {
    const state = getReactionFriendState(userId);
    if (state.status === 'SELF') {
      return null;
    }

    if (state.status === 'FRIEND') {
      return {
        action: 'FRIEND',
        label: t('commentSection.friendAction.friends'),
        disabled: true,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
      };
    }

    if (state.status === 'REQUEST_SENT') {
      return {
        action: 'REQUEST_SENT',
        label: t('commentSection.friendAction.cancelInvite'),
        disabled: false,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
      };
    }

    if (state.status === 'REQUEST_RECEIVED') {
      return {
        action: 'REQUEST_RECEIVED',
        label: t('commentSection.friendAction.accept'),
        disabled: false,
        className:
          'inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700',
      };
    }

    return {
      action: 'ADD_FRIEND',
      label: t('commentSection.friendAction.addFriend'),
      disabled: false,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700',
    };
  };

  return {
    reactionViewerComment,
    reactionViewerUsers,
    reactionViewerFilter,
    setReactionViewerFilter,
    reactionViewerError,
    isReactionViewerLoading,
    isReactionFriendshipLoading,
    reactionFriendActionUserId,
    closeReactionViewer,
    handleOpenReactionViewer,
    handleReactionFriendAction,
    reactionViewerTabs,
    filteredReactionViewerUsers,
    getReactionFriendActionMeta,
  };
};

export type UseCommentReactionViewerReturn = ReturnType<typeof useCommentReactionViewer>;
