import { STORAGE_KEYS, storage } from '@/shared/storage/storage';

export const normalizeBearerToken = (token: string | undefined): string | undefined => {
  if (!token) {
    return undefined;
  }

  const normalized = token.replace(/^Bearer\s+/i, '').trim();
  return normalized || undefined;
};

export const clearSessionAndRedirectToLogin = (): void => {
  storage.clearToken();
  storage.clearUser();
  localStorage.removeItem(STORAGE_KEYS.rememberMe);

  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/admin/login') {
    window.location.assign('/login');
  }
};

