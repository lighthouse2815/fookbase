import { Globe2, Lock, UsersRound, type LucideIcon } from 'lucide-react';

import type { PostVisibility } from '@/features/post/types/contracts';
import { parseApiDate } from '@/shared/lib/date';

export interface PostVisibilityMeta {
  value: PostVisibility;
  label: string;
  hint: string;
  icon: LucideIcon;
  chipClassName: string;
}

const VISIBILITY_VALUES: PostVisibility[] = ['PUBLIC', 'FRIENDS', 'ONLY_ME'];

export const POST_VISIBILITY_OPTIONS: ReadonlyArray<PostVisibilityMeta> = [
  {
    value: 'PUBLIC',
    label: 'Moi nguoi',
    hint: 'Ai cung co the xem',
    icon: Globe2,
    chipClassName:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  {
    value: 'FRIENDS',
    label: 'Ban be',
    hint: 'Chi ban be cua ban',
    icon: UsersRound,
    chipClassName:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300',
  },
  {
    value: 'ONLY_ME',
    label: 'Chi minh toi',
    hint: 'Chi tai khoan cua ban',
    icon: Lock,
    chipClassName:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
  },
];

export const parsePostVisibility = (value?: string | PostVisibility | null): PostVisibility => {
  if (!value) {
    return 'PUBLIC';
  }

  const normalized = value.trim().toUpperCase();
  return VISIBILITY_VALUES.includes(normalized as PostVisibility) ? (normalized as PostVisibility) : 'PUBLIC';
};

export const resolvePostVisibilityMeta = (visibility?: string | PostVisibility | null): PostVisibilityMeta => {
  const normalized = parsePostVisibility(visibility);
  return POST_VISIBILITY_OPTIONS.find((item) => item.value === normalized) ?? POST_VISIBILITY_OPTIONS[0];
};

export const isPostEdited = (createdAt: string, updatedAt?: string | null): boolean => {
  if (!updatedAt) {
    return false;
  }

  const created = parseApiDate(createdAt);
  const updated = parseApiDate(updatedAt);
  if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
    return false;
  }

  return updated.getTime() - created.getTime() > 1000;
};
