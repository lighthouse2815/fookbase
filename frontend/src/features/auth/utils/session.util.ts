import axios from 'axios';

import type { AuthSession } from '@/features/auth/types/contracts';
import type { User } from '@/features/user/types/contracts';

export const mapAuthUserToUser = (payload: AuthSession['user']): User => ({
  id: payload.id,
  username: payload.username,
  fullName: payload.username,
  email: payload.email,
  avatarUrl: payload.avatarUrl ?? 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
});

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );

    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const normalizeRole = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const extractRolesFromToken = (token: string | null): string[] => {
  if (!token) {
    return [];
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return [];
  }

  const roleKeys = [
    'role',
    'roles',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role',
  ];

  const roles: string[] = [];

  roleKeys.forEach((key) => {
    const rawValue = payload[key];

    if (Array.isArray(rawValue)) {
      rawValue.forEach((item) => {
        const role = normalizeRole(item);
        if (role) {
          roles.push(role);
        }
      });
      return;
    }

    const role = normalizeRole(rawValue);
    if (role) {
      roles.push(role);
    }
  });

  return Array.from(new Set(roles));
};

export const isUnauthorizedError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const statusCode = error.response?.status;
  return statusCode === 401 || statusCode === 403;
};

