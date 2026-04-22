import type { StoryReactionType } from '@/features/story/types/contracts';

import type { ReactionMeta } from '@/features/story/types/components';

export const IMAGE_DURATION_MS = 5000;
export const VIDEO_FALLBACK_DURATION_MS = 9000;

export const REACTION_OPTIONS: ReactionMeta[] = [
  { type: 'LIKE', labelKey: 'story.reactions.like', icon: '\u{1F44D}' },
  { type: 'WOW', labelKey: 'story.reactions.wow', icon: '\u{1F62E}' },
  { type: 'SAD', labelKey: 'story.reactions.sad', icon: '\u{1F622}' },
  { type: 'ANGRY', labelKey: 'story.reactions.angry', icon: '\u{1F621}' },
  { type: 'HAHA', labelKey: 'story.reactions.haha', icon: '\u{1F602}' },
  { type: 'LOVE', labelKey: 'story.reactions.love', icon: '\u2764\uFE0F' },
];

export function getReactionMeta(reactionType?: StoryReactionType | null): ReactionMeta {
  if (!reactionType) {
    return REACTION_OPTIONS[0];
  }

  return REACTION_OPTIONS.find((option) => option.type === reactionType) ?? REACTION_OPTIONS[0];
}
