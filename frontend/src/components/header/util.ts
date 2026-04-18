import type { Profile } from '@/interface/profile';

export function normalizeProfileDisplayName(displayName: string | undefined): string {
  return displayName?.trim() || 'user';
}

export function normalizeOptionalTrimmed(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeFriendshipStatus(raw: string | undefined): string {
  return raw?.trim().toUpperCase() ?? '';
}

export function getVisibleFriendsCount(profile: Profile): number {
  return (profile.friendCountVisible ?? true) ? profile.friendsCount : 0;
}
