import type { Profile } from '@/features/profile/types/contracts';

export const normalizeProfileDisplayName = (displayName: string | undefined): string => {
  return displayName?.trim() || 'user';
};

export const normalizeOptionalTrimmed = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const getVisibleFriendsCount = (profile: Profile): number => {
  return (profile.friendCountVisible ?? true) ? profile.friendsCount : 0;
};

