import type { ReactNode } from 'react';

import type {
  CompleteProfileMode,
  CompleteProfilePrefill,
  LoginInput,
  RegisterInput,
  RegisterResult,
} from '@/features/auth/types/contracts';
import type { User } from '@/features/user/types/contracts';

export interface AuthProviderProps {
  children: ReactNode;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  roles: string[];
  isAdmin: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginInput) => Promise<void>;
  authWithGoogle: (tokenId: string, rememberMe?: boolean) => Promise<void>;
  loginAdmin: (payload: LoginInput) => Promise<void>;
  register: (payload: RegisterInput) => Promise<RegisterResult>;
  logout: () => void;
  requiresProfileCompletion: boolean;
  markProfileCompleted: () => Promise<void>;
  completeProfileMode: CompleteProfileMode;
  completeProfilePrefill: CompleteProfilePrefill | null;
}

