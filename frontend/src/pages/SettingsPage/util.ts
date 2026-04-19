import type { PersonalInfoFormState } from './interface';
import type { SettingsTabId } from './type';

export const parseTabId = (value: string | null): SettingsTabId | null => {
  if (
    value === 'security'
    || value === 'personal-info'
    || value === 'profile-page-info'
    || value === 'reports'
    || value === 'blocked'
  ) {
    return value;
  }

  return null;
};

export const normalizeKeyword = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const REPORTED_POSTS_PAGE_SIZE = 10;

export const EMPTY_PERSONAL_INFO_FORM: PersonalInfoFormState = {
  displayName: '',
  firstName: '',
  lastName: '',
  birthday: '',
  gender: '',
  avatarUrl: '',
};

export const normalizePersonalInfoGender = (value?: string | null): string => value?.trim().toUpperCase() ?? '';

export const toFallbackAvatarUrl = (_seed?: string) => 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';

export const isImageFile = (file: File) => file.type.trim().toLowerCase().startsWith('image/');

export const getReportStatusBadgeClass = (status: string) => {
  const normalized = status.trim().toUpperCase();
  if (normalized === 'RESOLVED') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }

  if (normalized === 'REJECTED') {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
  }

  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
};
