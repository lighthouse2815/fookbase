/* eslint-disable react-refresh/only-export-components */
import axios from 'axios';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse } from '../types/auth';
import type { User } from '../types/user';
import { STORAGE_KEYS, storage } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  roles: string[];
  isAdmin: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  requiresProfileCompletion: boolean;
  login: (payload: LoginRequest) => Promise<{ requiresProfileCompletion: boolean }>;
  loginAdmin: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  markProfileCompleted: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapAuthUserToUser = (payload: AuthResponse['user']): User => ({
  id: payload.id,
  username: payload.username,
  fullName: payload.username,
  email: payload.email,
  avatarUrl: payload.avatarUrl ?? `https://i.pravatar.cc/150?u=${payload.id}`,
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

const extractRolesFromToken = (token: string | null): string[] => {
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

const isUnauthorizedError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const statusCode = error.response?.status;
  return statusCode === 401 || statusCode === 403;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [user, setUser] = useState<User | null>(storage.getUser<User>());
  const [isInitializing, setIsInitializing] = useState(true);
  const [requiresProfileCompletion, setRequiresProfileCompletion] = useState<boolean>(storage.getProfileCompletionRequired());
  const roles = useMemo(() => extractRolesFromToken(token), [token]);
  const isAdmin = useMemo(
    () => roles.some((role) => role.toLowerCase() === 'admin'),
    [roles],
  );

  const syncProfileCompletionRequirement = (required: boolean) => {
    setRequiresProfileCompletion(required);

    if (required) {
      storage.setProfileCompletionRequired(true);
      return;
    }

    storage.clearProfileCompletionRequired();
  };

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = storage.getToken();

      if (!savedToken) {
        storage.clearUser();
        storage.clearProfileCompletionRequired();
        setRequiresProfileCompletion(false);
        setUser(null);
        setIsInitializing(false);
        return;
      }

      try {
        const current = await userService.getCurrentUser();
        setUser(current);
        storage.setUser(current);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          storage.clearToken();
          storage.clearUser();
          storage.clearProfileCompletionRequired();
          localStorage.removeItem(STORAGE_KEYS.rememberMe);
          setRequiresProfileCompletion(false);
          setToken(null);
          setUser(null);
          return;
        }

        const cachedUser = storage.getUser<User>();

        if (cachedUser) {
          setUser(cachedUser);
        } else {
          storage.clearToken();
          storage.clearUser();
          storage.clearProfileCompletionRequired();
          localStorage.removeItem(STORAGE_KEYS.rememberMe);
          setRequiresProfileCompletion(false);
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    void bootstrap();
  }, []);

  const establishSession = async (response: AuthResponse, rememberMe: boolean | undefined) => {
    const requiresCompletion = response.profileCompleted === false;
    storage.setToken(response.token);
    localStorage.setItem(STORAGE_KEYS.rememberMe, String(Boolean(rememberMe)));
    syncProfileCompletionRequirement(requiresCompletion);

    setToken(response.token);

    try {
      const current = await userService.getCurrentUser();
      setUser(current);
      storage.setUser(current);
    } catch {
      const fallbackUser = mapAuthUserToUser(response.user);
      setUser(fallbackUser);
      storage.setUser(fallbackUser);
    }

    return { requiresProfileCompletion: requiresCompletion };
  };

  const login = async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    return establishSession(response, payload.rememberMe);
  };

  const loginAdmin = async (payload: LoginRequest) => {
    const response = await authService.loginAdmin(payload);
    await establishSession(response, payload.rememberMe);
  };

  const register = async (payload: RegisterRequest) => {
    return authService.register(payload);
  };

  const markProfileCompleted = async () => {
    syncProfileCompletionRequirement(false);

    try {
      const current = await userService.getCurrentUser();
      setUser(current);
      storage.setUser(current);
    } catch {
      // Keep existing user payload when refresh fails.
    }
  };

  const logout = () => {
    void authService.logout().catch(() => undefined);
    storage.clearToken();
    storage.clearUser();
    storage.clearProfileCompletionRequired();
    localStorage.removeItem(STORAGE_KEYS.rememberMe);

    setRequiresProfileCompletion(false);
    setToken(null);
    setUser(null);
  };

  const contextValue = useMemo(
    () => ({
      user,
      token,
      roles,
      isAdmin,
      isAuthenticated: Boolean(token),
      isInitializing,
      requiresProfileCompletion,
      login,
      loginAdmin,
      register,
      markProfileCompleted,
      logout,
    }),
    [isAdmin, isInitializing, requiresProfileCompletion, roles, token, user],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

