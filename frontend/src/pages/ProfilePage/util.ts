import type { MainLayoutOutletContext } from '@/layouts/MainLayout';

import type { Profile } from './interface';
import type { FriendshipStatusCode } from './type';

export const PROFILE_POST_COLUMN_CLASS = 'mx-auto w-full max-w-[980px]';

export const PROFILE_POSTS_PAGE_SIZE = 100;

const DEFAULT_PUBLIC_USERNAME = 'user';
const DEFAULT_PUBLIC_DISPLAY_NAME = 'User';

export const createDefaultProfile = (
  user: MainLayoutOutletContext['currentUser'],
): Profile => ({
  id: user.id,
  username: user.username,
  displayName: user.fullName,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  bio: '',
  coverUrl: undefined,
  friendsCount: 0,
  postsCount: 0,
  fullNameVisible: true,
  phoneVisible: true,
  emailVisible: true,
  dateOfBirthVisible: true,
  genderVisible: true,
  friendCountVisible: true,
});

export const createFallbackProfile = (
  targetUserId: string,
  currentUser: MainLayoutOutletContext['currentUser'],
): Profile => {
  if (targetUserId === currentUser.id) {
    return createDefaultProfile(currentUser);
  }

  return {
    ...createDefaultProfile(currentUser),
    id: targetUserId,
    username: DEFAULT_PUBLIC_USERNAME,
    displayName: DEFAULT_PUBLIC_DISPLAY_NAME,
    fullName: '',
    avatarUrl: `https://i.pravatar.cc/150?u=${targetUserId}`,
  };
};

export const normalizeFriendshipStatus = (value?: string): FriendshipStatusCode => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return 'NONE';
  }

  if (
    normalized === 'NONE'
    || normalized === 'PENDING'
    || normalized === 'INVITED'
    || normalized === 'ACCEPTED'
    || normalized === 'BLOCKED'
    || normalized === 'REJECTED'
    || normalized === 'REMOVED'
  ) {
    return normalized;
  }

  return 'UNKNOWN';
};

export const formatGender = (
  value: string | undefined,
  emptyValue: string,
  maleLabel: string,
  femaleLabel: string,
  otherLabel: string,
): string => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return emptyValue;
  }

  if (normalized === 'MALE') {
    return maleLabel;
  }

  if (normalized === 'FEMALE') {
    return femaleLabel;
  }

  if (normalized === 'OTHER') {
    return otherLabel;
  }

  return value?.trim() || emptyValue;
};

export const formatBirthDate = (value: string | undefined, emptyValue: string, locale: string): string => {
  const normalized = value?.trim();
  if (!normalized) {
    return emptyValue;
  }

  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return normalized;
  }

  return new Intl.DateTimeFormat(locale).format(new Date(timestamp));
};
