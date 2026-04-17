import axios from 'axios';

import type { AuthResponse } from '@/interface/auth';
import type { RawAuthPayload } from '@/services/auth/interface';

export const toNormalizedText = (value: string | undefined): string => {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();
};

export const extractApiErrorMessage = (error: unknown): string | undefined => {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }

  const payload = error.response?.data as
    | {
        message?: string;
        error?: string;
        errors?: string[];
      }
    | undefined;

  return payload?.message ?? payload?.error ?? payload?.errors?.find(Boolean);
};

export const isBannedLoginMessage = (message: string | undefined): boolean => {
  const normalized = toNormalizedText(message);
  if (!normalized) {
    return false;
  }

  return (
    normalized.includes('user_banned') ||
    normalized.includes('tai khoan da bi cam') ||
    normalized.includes('tai khoan bi cam') ||
    normalized.includes('bi cam') ||
    normalized.includes('account is banned') ||
    normalized.includes('account banned') ||
    normalized.includes('banned')
  );
};

export const normalizeToken = (token: string | undefined): string | undefined => {
  if (!token) {
    return undefined;
  }

  return token.replace(/^Bearer\s+/i, '').trim();
};

export const normalizeStatus = (status: string | undefined): string | undefined => {
  if (!status) {
    return undefined;
  }

  const normalizedStatus = status.trim().toUpperCase();
  return normalizedStatus || undefined;
};

export const normalizeUserPayload = (payload: RawAuthPayload): AuthResponse['user'] => {
  return (
    payload.user ?? {
      id: payload.userId ?? 'unknown',
      username: payload.username ?? payload.displayName ?? 'user',
      email: payload.email ?? '',
      avatarUrl: payload.avatarUrl,
    }
  );
};

export const normalizeAuthPayload = (payload: RawAuthPayload): AuthResponse | null => {
  const token = normalizeToken(payload.token ?? payload.accessToken ?? payload.jwt);

  if (!token) {
    return null;
  }

  return { token, user: normalizeUserPayload(payload) };
};
