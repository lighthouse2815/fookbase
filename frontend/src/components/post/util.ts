import type { PostReactionType, PostReactionUser } from '@/interface/post';

import type { FriendActionButtonMeta, ReactionFriendState, ReactionMeta } from './interface';
import type { ReactionFilterTab } from './type';

export const MAX_IMAGE_FILE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const CREATE_POST_ICON_OPTIONS = ['^_^', ':)', '<3', ':D', ':P'] as const;

export const POST_REACTION_OPTIONS: ReactionMeta[] = [
  { type: 'LIKE', label: 'Thich', icon: '👍' },
  { type: 'WOW', label: 'Wow', icon: '😮' },
  { type: 'SAD', label: 'Sad', icon: '😢' },
  { type: 'ANGRY', label: 'Gian', icon: '😡' },
  { type: 'HAHA', label: 'Haha', icon: '😂' },
  { type: 'LOVE', label: 'Tim', icon: '❤️' },
];

export const POST_REACTION_META_BY_TYPE: Record<PostReactionType, ReactionMeta> =
  POST_REACTION_OPTIONS.reduce<Record<PostReactionType, ReactionMeta>>(
    (accumulator, item) => {
      accumulator[item.type] = item;
      return accumulator;
    },
    {
      LIKE: POST_REACTION_OPTIONS[0],
      WOW: POST_REACTION_OPTIONS[1],
      SAD: POST_REACTION_OPTIONS[2],
      ANGRY: POST_REACTION_OPTIONS[3],
      HAHA: POST_REACTION_OPTIONS[4],
      LOVE: POST_REACTION_OPTIONS[5],
    },
  );

export const detectKindFromFile = (file: File): 'image' | 'video' | null => {
  const mimeType = file.type.trim().toLowerCase();
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  return null;
};

export const getReactionMeta = (reactionType?: PostReactionType | null): ReactionMeta => {
  if (!reactionType) {
    return POST_REACTION_META_BY_TYPE.LIKE;
  }

  return POST_REACTION_META_BY_TYPE[reactionType] ?? POST_REACTION_META_BY_TYPE.LIKE;
};

export const getReactionButtonToneClass = (reactionType?: PostReactionType | null) => {
  if (!reactionType) {
    return 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700';
  }

  if (reactionType === 'LIKE') {
    return 'bg-blue-50 text-blue-600 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/40';
  }

  if (reactionType === 'ANGRY' || reactionType === 'LOVE') {
    return 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/40';
  }

  return 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/40';
};

export const normalizeReactionUserId = (value: string) => value.trim().toLowerCase();

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
      label: 'Ban be',
      disabled: true,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    };
  }

  if (state.status === 'REQUEST_SENT') {
    return {
      label: 'Huy loi moi',
      disabled: false,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
    };
  }

  if (state.status === 'REQUEST_RECEIVED') {
    return {
      label: 'Xac nhan',
      disabled: false,
      className:
        'inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700',
    };
  }

  return {
    label: 'Them ban be',
    disabled: false,
    className:
      'inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700',
  };
};

export const buildReactionViewerTabs = (
  users: PostReactionUser[],
): Array<{ type: ReactionFilterTab; label: string; count: number }> => {
  const countsByType = users.reduce<Record<PostReactionType, number>>(
    (accumulator, user) => {
      accumulator[user.reactionType] = (accumulator[user.reactionType] ?? 0) + 1;
      return accumulator;
    },
    {
      LIKE: 0,
      WOW: 0,
      SAD: 0,
      ANGRY: 0,
      HAHA: 0,
      LOVE: 0,
    },
  );

  return [
    { type: 'ALL' as ReactionFilterTab, label: 'Tat ca', count: users.length },
    ...POST_REACTION_OPTIONS.filter((reaction) => countsByType[reaction.type] > 0).map((reaction) => ({
      type: reaction.type as ReactionFilterTab,
      label: reaction.icon,
      count: countsByType[reaction.type],
    })),
  ];
};
