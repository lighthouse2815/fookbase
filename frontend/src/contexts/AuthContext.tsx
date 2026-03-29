/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse } from '../types/auth';
import type { User } from '../types/user';
import { STORAGE_KEYS, storage } from '../utils/storage';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [user, setUser] = useState<User | null>(storage.getUser<User>());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const savedToken = storage.getToken();

      if (!savedToken) {
        storage.clearUser();
        setUser(null);
        setIsInitializing(false);
        return;
      }

      try {
        const current = await userService.getCurrentUser();
        setUser(current);
        storage.setUser(current);
      } catch {
        const cachedUser = storage.getUser<User>();

        if (cachedUser) {
          setUser(cachedUser);
        } else {
          storage.clearToken();
          storage.clearUser();
          localStorage.removeItem(STORAGE_KEYS.rememberMe);
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    void bootstrap();
  }, []);

  const login = async (payload: LoginRequest) => {
    const response = await authService.login(payload);

    storage.setToken(response.token);
    localStorage.setItem(STORAGE_KEYS.rememberMe, String(Boolean(payload.rememberMe)));

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
  };

  const register = async (payload: RegisterRequest) => {
    return authService.register(payload);
  };

  const logout = () => {
    void authService.logout().catch(() => undefined);
    storage.clearToken();
    storage.clearUser();
    localStorage.removeItem(STORAGE_KEYS.rememberMe);

    setToken(null);
    setUser(null);
  };

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      register,
      logout,
    }),
    [isInitializing, token, user],
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

