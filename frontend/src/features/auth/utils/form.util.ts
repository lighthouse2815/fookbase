import type { TFunction } from 'i18next';

import type { AdminLoginLocationState } from '@/features/auth/types/hooks';

export const AUTH_IDENTIFIER_PATTERN = /^([a-zA-Z0-9._-]{3,}|[\w.-]+@[\w-]+\.[\w.-]{2,})$/;

export const AUTH_OTP_PATTERN = /^[0-9]{4,8}$/;

export const AUTH_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AUTH_PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

export const REGISTER_PASSWORD_STRENGTH_COLORS = {
  weak: 'bg-rose-500',
  medium: 'bg-amber-500',
  strong: 'bg-emerald-500',
} as const;

export const getRegisterPasswordStrengthLabels = (t: TFunction) =>
  ({
    weak: t('auth.passwordWeak'),
    medium: t('auth.passwordMedium'),
    strong: t('auth.passwordStrong'),
  }) as const;

export const resolveAdminLoginDestination = (locationState: AdminLoginLocationState | null): string => {
  const requestedPath = locationState?.from?.pathname;
  return requestedPath?.startsWith('/admin') ? requestedPath : '/admin/dashboard';
};

