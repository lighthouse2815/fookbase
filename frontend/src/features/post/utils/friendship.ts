import type { FriendActionButtonMeta, ReactionFriendState } from '@/features/post/types/components';

export const normalizeReactionUserId = (value: string): string => value.trim().toLowerCase();

export const buildFriendStateLookup = (
  friendIds: string[],
  receivedRequests: Array<{ id: string; requestId: string }>,
  sentRequests: Array<{ id: string; requestId: string }>,
): Record<string, ReactionFriendState> => {
  const states: Record<string, ReactionFriendState> = {};

  friendIds.forEach((id) => {
    states[normalizeReactionUserId(id)] = { status: 'FRIEND' };
  });

  sentRequests.forEach((request) => {
    const key = normalizeReactionUserId(request.id);
    if (states[key]?.status === 'FRIEND') {
      return;
    }

    states[key] = {
      status: 'REQUEST_SENT',
      requestId: request.requestId,
    };
  });

  receivedRequests.forEach((request) => {
    const key = normalizeReactionUserId(request.id);
    if (states[key]) {
      return;
    }

    states[key] = {
      status: 'REQUEST_RECEIVED',
      requestId: request.requestId,
    };
  });

  return states;
};

export const getReactionViewerFriendState = (
  userId: string,
  normalizedCurrentUserId: string,
  friendStatesByUserId: Record<string, ReactionFriendState>,
): ReactionFriendState => {
  if (normalizeReactionUserId(userId) === normalizedCurrentUserId) {
    return { status: 'SELF' };
  }

  return friendStatesByUserId[normalizeReactionUserId(userId)] ?? { status: 'NONE' };
};

export const getFriendActionMeta = (
  userId: string,
  normalizedCurrentUserId: string,
  friendStatesByUserId: Record<string, ReactionFriendState>,
): FriendActionButtonMeta | null => {
  const state = getReactionViewerFriendState(userId, normalizedCurrentUserId, friendStatesByUserId);
  if (state.status === 'SELF') {
    return null;
  }

  if (state.status === 'FRIEND') {
    return {
      label: 'Bạn bè',
      disabled: true,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    };
  }

  if (state.status === 'REQUEST_SENT') {
    return {
      label: 'Hủy lời mời',
      disabled: false,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
    };
  }

  if (state.status === 'REQUEST_RECEIVED') {
    return {
      label: 'Xác nhận',
      disabled: false,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700',
    };
  }

  return {
    label: 'Thêm bạn bè',
    disabled: false,
    className:
      'inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700',
  };
};
