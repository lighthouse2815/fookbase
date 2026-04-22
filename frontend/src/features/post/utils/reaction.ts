import type { PostReactionType, PostReactionUser } from '@/features/post/types/contracts';
import type { ReactionFilterTab, ReactionMeta, ReactionViewerTab } from '@/features/post/types/components';

export const POST_REACTION_OPTIONS: ReactionMeta[] = [
  { type: 'LIKE', label: 'Thich', icon: '\u{1F44D}' },
  { type: 'WOW', label: 'Wow', icon: '\u{1F62E}' },
  { type: 'SAD', label: 'Sad', icon: '\u{1F622}' },
  { type: 'ANGRY', label: 'Gian', icon: '\u{1F621}' },
  { type: 'HAHA', label: 'Haha', icon: '\u{1F602}' },
  { type: 'LOVE', label: 'Tim', icon: '\u2764\uFE0F' },
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

export const getReactionMeta = (reactionType?: PostReactionType | null): ReactionMeta => {
  if (!reactionType) {
    return POST_REACTION_META_BY_TYPE.LIKE;
  }

  return POST_REACTION_META_BY_TYPE[reactionType] ?? POST_REACTION_META_BY_TYPE.LIKE;
};

export const getReactionButtonToneClass = (reactionType?: PostReactionType | null): string => {
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

export const buildReactionViewerTabs = (users: PostReactionUser[]): ReactionViewerTab[] => {
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
