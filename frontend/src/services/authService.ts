import { apiClient } from './apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

interface RawAuthPayload {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: AuthResponse['user'];
  userId?: string;
  username?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  errors?: string[];
}

const extractAuthPayload = (
  payload: RawAuthPayload | ApiEnvelope<RawAuthPayload>,
): RawAuthPayload => {
  const envelope = payload as ApiEnvelope<RawAuthPayload>;

  if (envelope.data) {
    return envelope.data;
  }

  return payload as RawAuthPayload;
};

const hasToken = (payload: RawAuthPayload): boolean =>
  Boolean(payload.token ?? payload.accessToken ?? payload.jwt);

const normalizeAuthPayload = (payload: RawAuthPayload): AuthResponse => {
  const token = payload.token ?? payload.accessToken ?? payload.jwt;

  if (!token) {
    throw new Error('Missing token in auth response');
  }

  const user =
    payload.user ??
    {
      id: payload.userId ?? 'unknown',
      username: payload.username ?? payload.displayName ?? 'user',
      email: payload.email ?? '',
      avatarUrl: payload.avatarUrl,
    };

  return { token, user };
};

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<RawAuthPayload | ApiEnvelope<RawAuthPayload>>('/api/auth/login', payload);
    const authPayload = extractAuthPayload(response.data);
    return normalizeAuthPayload(authPayload);
  },

  async register(payload: RegisterRequest): Promise<AuthResponse | null> {
    const response = await apiClient.post<RawAuthPayload | ApiEnvelope<RawAuthPayload>>('/api/auth/register', payload);
    const authPayload = extractAuthPayload(response.data);

    if (!hasToken(authPayload)) {
      return null;
    }

    return normalizeAuthPayload(authPayload);
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },
};

