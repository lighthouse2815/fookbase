/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authService } from '@/features/auth/api/service/authService';
import type {
  AuthSession,
  CompleteProfileMode,
  CompleteProfilePrefill,
  LoginInput,
  RegisterInput,
} from '@/features/auth/types/contracts';
import type { AuthContextValue, AuthProviderProps } from '@/features/auth/types/context';
import {
  extractRolesFromToken,
  isUnauthorizedError,
  mapAuthUserToUser,
} from '@/features/auth/utils/session.util';
import { userService } from '@/features/user/api/service/userService';
import type { User } from '@/features/user/types/contracts';
import { STORAGE_KEYS, storage } from '@/shared/storage/storage';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [user, setUser] = useState<User | null>(storage.getUser<User>());
  const [profileCompleted, setProfileCompleted] = useState<boolean>(
    () => storage.getProfileCompleted() ?? true,
  );
  const [completeProfileMode, setCompleteProfileMode] = useState<CompleteProfileMode>(
    () => (storage.getCompleteProfileMode() === 'google' ? 'google' : 'local'),
  );
  const [completeProfilePrefill, setCompleteProfilePrefill] = useState<CompleteProfilePrefill | null>(
    () => storage.getCompleteProfilePrefill<CompleteProfilePrefill>(),
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const roles = useMemo(() => extractRolesFromToken(token), [token]);
  const isAdmin = useMemo(
    () => roles.some((role) => role.toLowerCase() === 'admin'),
    [roles],
  );

  const requiresProfileCompletion = useMemo(
    () => Boolean(token) && !profileCompleted,
    [token, profileCompleted],
  );

  const markProfileCompleted = useCallback(async () => {
    setProfileCompleted(true);
    storage.setProfileCompleted(true);
    storage.clearCompleteProfileMode();
    storage.clearCompleteProfilePrefill();
    setCompleteProfileMode('local');
    setCompleteProfilePrefill(null);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = storage.getToken();

      if (!savedToken) {
        storage.clearUser();
        storage.clearProfileCompleted();
        storage.clearCompleteProfileMode();
        storage.clearCompleteProfilePrefill();
        setUser(null);
        setProfileCompleted(true);
        setCompleteProfileMode('local');
        setCompleteProfilePrefill(null);
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
          storage.clearProfileCompleted();
          storage.clearCompleteProfileMode();
          storage.clearCompleteProfilePrefill();
          localStorage.removeItem(STORAGE_KEYS.rememberMe);
          setToken(null);
          setUser(null);
          setProfileCompleted(true);
          setCompleteProfileMode('local');
          setCompleteProfilePrefill(null);
          return;
        }

        const cachedUser = storage.getUser<User>();

        if (cachedUser) {
          setUser(cachedUser);
        } else {
          storage.clearToken();
          storage.clearUser();
          storage.clearProfileCompleted();
          storage.clearCompleteProfileMode();
          storage.clearCompleteProfilePrefill();
          localStorage.removeItem(STORAGE_KEYS.rememberMe);
          setToken(null);
          setUser(null);
          setProfileCompleted(true);
          setCompleteProfileMode('local');
          setCompleteProfilePrefill(null);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    void bootstrap();
  }, []);

  const establishSession = useCallback(async (response: AuthSession, rememberMe: boolean | undefined) => {
    storage.setToken(response.token);
    localStorage.setItem(STORAGE_KEYS.rememberMe, String(Boolean(rememberMe)));
    storage.setProfileCompleted(response.profileCompleted);
    setProfileCompleted(response.profileCompleted);
    if (response.profileCompleted) {
      storage.clearCompleteProfileMode();
      storage.clearCompleteProfilePrefill();
      setCompleteProfileMode('local');
      setCompleteProfilePrefill(null);
    } else {
      const mode = response.completeProfileMode ?? 'local';
      const prefill = response.completeProfilePrefill ?? null;
      storage.setCompleteProfileMode(mode);
      if (prefill) {
        storage.setCompleteProfilePrefill(prefill);
      } else {
        storage.clearCompleteProfilePrefill();
      }
      setCompleteProfileMode(mode);
      setCompleteProfilePrefill(prefill);
    }

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
  }, []);

  const login = useCallback(async (payload: LoginInput) => {
    const response = await authService.login(payload);
    await establishSession(response, payload.rememberMe);
  }, [establishSession]);

  const authWithGoogle = useCallback(async (tokenId: string, rememberMe = true) => {
    const response = await authService.authWithGoogle(tokenId);
    await establishSession(response, rememberMe);
  }, [establishSession]);

  const loginAdmin = useCallback(async (payload: LoginInput) => {
    const response = await authService.loginAdmin(payload);
    await establishSession(response, payload.rememberMe);
  }, [establishSession]);

  const register = useCallback(async (payload: RegisterInput) => {
    return authService.register(payload);
  }, []);

  const logout = useCallback(() => {
    void authService.logout().catch(() => undefined);
    storage.clearToken();
    storage.clearUser();
    storage.clearProfileCompleted();
    storage.clearCompleteProfileMode();
    storage.clearCompleteProfilePrefill();
    localStorage.removeItem(STORAGE_KEYS.rememberMe);

    setToken(null);
    setUser(null);
    setProfileCompleted(true);
    setCompleteProfileMode('local');
    setCompleteProfilePrefill(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      roles,
      isAdmin,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      authWithGoogle,
      loginAdmin,
      register,
      logout,
      requiresProfileCompletion,
      markProfileCompleted,
      completeProfileMode,
      completeProfilePrefill,
    }),
    [
      authWithGoogle,
      completeProfileMode,
      completeProfilePrefill,
      isAdmin,
      isInitializing,
      login,
      loginAdmin,
      markProfileCompleted,
      logout,
      register,
      requiresProfileCompletion,
      roles,
      token,
      user,
    ],
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

