import { useCallback, useEffect, useMemo, useState } from 'react';

import { friendshipService } from '@/services/friendshipService';
import { postService } from '@/services/postService';
import type { PostReactionUser } from '@/interface/post';
import { getApiErrorMessage } from '@/utils/apiError';

import type { PostReactionViewerModalProps, ReactionFriendState } from '../interface';
import type { ReactionFilterTab } from '../type';
import {
  buildFriendStateLookup,
  buildReactionViewerTabs,
  getFriendActionMeta,
  getReactionViewerFriendState,
  normalizeReactionUserId,
  POST_REACTION_META_BY_TYPE,
} from '../util';

type UsePostReactionViewerModalParams = PostReactionViewerModalProps;

export const usePostReactionViewerModal = ({
  postId,
  isOpen,
  initialFilter,
  currentUserId,
  onActionToast,
}: UsePostReactionViewerModalParams) => {
  const [users, setUsers] = useState<PostReactionUser[]>([]);
  const [filter, setFilter] = useState<ReactionFilterTab>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFriendshipLoading, setIsFriendshipLoading] = useState(false);
  const [friendStatesByUserId, setFriendStatesByUserId] = useState<Record<string, ReactionFriendState>>({});
  const [friendActionUserId, setFriendActionUserId] = useState<string | null>(null);

  const normalizedCurrentUserId = normalizeReactionUserId(currentUserId);

  const handleFriendAction = useCallback(
    async (user: PostReactionUser) => {
      if (friendActionUserId) {
        return;
      }

      const state = getReactionViewerFriendState(user.userId, normalizedCurrentUserId, friendStatesByUserId);
      if (state.status === 'SELF' || state.status === 'FRIEND') {
        return;
      }

      setFriendActionUserId(user.userId);
      setError(null);

      try {
        if (state.status === 'NONE') {
          await friendshipService.sendFriendRequest(user.userId);
          setFriendStatesByUserId((current) => ({
            ...current,
            [normalizeReactionUserId(user.userId)]: {
              status: 'REQUEST_SENT',
              requestId: user.userId,
            },
          }));
        } else if (state.status === 'REQUEST_SENT') {
          await friendshipService.cancelSentRequest(state.requestId ?? user.userId);
          setFriendStatesByUserId((current) => ({
            ...current,
            [normalizeReactionUserId(user.userId)]: { status: 'NONE' },
          }));
        } else if (state.status === 'REQUEST_RECEIVED') {
          await friendshipService.acceptFriendRequest(state.requestId ?? user.userId);
          setFriendStatesByUserId((current) => ({
            ...current,
            [normalizeReactionUserId(user.userId)]: { status: 'FRIEND' },
          }));
        }
      } catch (actionError) {
        const message = getApiErrorMessage(actionError, 'Khong the cap nhat trang thai ban be.');
        setError(message);
        onActionToast?.(message, 'error');
      } finally {
        setFriendActionUserId(null);
      }
    },
    [friendActionUserId, friendStatesByUserId, normalizedCurrentUserId, onActionToast],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isActive = true;
    setFilter(initialFilter);
    setError(null);
    setIsLoading(true);
    setIsFriendshipLoading(true);
    setUsers([]);
    setFriendStatesByUserId({});

    const load = async () => {
      const [reactionUsersResult, friendsResult, receivedRequestsResult, sentRequestsResult] = await Promise.allSettled([
        postService.getPostReactionUsers(postId),
        friendshipService.getFriends(),
        friendshipService.getReceivedRequests(),
        friendshipService.getSentRequests(),
      ]);

      if (!isActive) {
        return;
      }

      if (reactionUsersResult.status === 'fulfilled') {
        setUsers(reactionUsersResult.value.users);
      } else {
        setError(getApiErrorMessage(reactionUsersResult.reason, 'Khong the tai danh sach reaction.'));
      }

      const friendIds = friendsResult.status === 'fulfilled' ? friendsResult.value.map((friend) => friend.id) : [];
      const receivedRequests =
        receivedRequestsResult.status === 'fulfilled'
          ? receivedRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
          : [];
      const sentRequests =
        sentRequestsResult.status === 'fulfilled'
          ? sentRequestsResult.value.map((request) => ({ id: request.id, requestId: request.requestId }))
          : [];

      setFriendStatesByUserId(buildFriendStateLookup(friendIds, receivedRequests, sentRequests));
      setIsLoading(false);
      setIsFriendshipLoading(false);
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [initialFilter, isOpen, postId]);

  const tabs = useMemo(() => buildReactionViewerTabs(users), [users]);

  const filteredUsers = useMemo(() => {
    if (filter === 'ALL') {
      return users;
    }

    return users.filter((user) => user.reactionType === filter);
  }, [filter, users]);

  useEffect(() => {
    if (filter === 'ALL') {
      return;
    }

    const hasMatching = users.some((user) => user.reactionType === filter);
    if (!hasMatching) {
      setFilter('ALL');
    }
  }, [filter, users]);

  const getMetaForUser = useCallback(
    (userId: string) => getFriendActionMeta(userId, normalizedCurrentUserId, friendStatesByUserId),
    [friendStatesByUserId, normalizedCurrentUserId],
  );

  return {
    users,
    filter,
    setFilter,
    error,
    isLoading,
    isFriendshipLoading,
    friendActionUserId,
    tabs,
    filteredUsers,
    reactionMetaByType: POST_REACTION_META_BY_TYPE,
    getFriendActionMeta: getMetaForUser,
    handleFriendAction,
  };
};
