import { apiClient } from './apiClient';
import type {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  OtpRequest,
  OtpVerifyResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from '../types/auth';

interface RawAuthPayload {
  token?: string;
  accessToken?: string;
  jwt?: string;
  status?: string;
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

export class InactiveAccountError extends Error {
  readonly status = 'INACTIVE';
  readonly email?: string;

  constructor(email?: string) {
    super('Account inactive. Email verification required.');
    this.name = 'InactiveAccountError';
    this.email = email?.trim() || undefined;
  }
}

const extractEnvelopeData = <T>(payload: T | ApiEnvelope<T>): T => {
  const envelope = payload as ApiEnvelope<T>;
  if (typeof envelope === 'object' && envelope !== null && 'data' in envelope && envelope.data !== undefined) {
    return envelope.data;
  }

  return payload as T;
};

const normalizeToken = (token: string | undefined): string | undefined => {
  if (!token) {
    return undefined;
  }

  return token.replace(/^Bearer\s+/i, '').trim();
};

const normalizeStatus = (status: string | undefined): string | undefined => {
  if (!status) {
    return undefined;
  }

  const normalizedStatus = status.trim().toUpperCase();
  return normalizedStatus || undefined;
};

const normalizeUserPayload = (payload: RawAuthPayload): AuthResponse['user'] => {
  return (
    payload.user ?? {
      id: payload.userId ?? 'unknown',
      username: payload.username ?? payload.displayName ?? 'user',
      email: payload.email ?? '',
      avatarUrl: payload.avatarUrl,
    }
  );
};

const normalizeAuthPayload = (payload: RawAuthPayload): AuthResponse | null => {
  const token = normalizeToken(payload.token ?? payload.accessToken ?? payload.jwt);

  if (!token) {
    return null;
  }

  return { token, user: normalizeUserPayload(payload) };
};

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<RawAuthPayload | ApiEnvelope<RawAuthPayload>>('/api/auth/login', payload);
    const authPayload = extractEnvelopeData(response.data);
    const authResponse = normalizeAuthPayload(authPayload);

    if (authResponse) {
      return authResponse;
    }

    const accountStatus = normalizeStatus(authPayload.status);
    if (accountStatus === 'INACTIVE') {
      throw new InactiveAccountError(authPayload.email);
    }

    throw new Error('Missing token in auth response');
  },

  async loginAdmin(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<RawAuthPayload | ApiEnvelope<RawAuthPayload>>('/api/auth/admin/login', payload);
    const authPayload = extractEnvelopeData(response.data);
    const authResponse = normalizeAuthPayload(authPayload);

    if (!authResponse) {
      throw new Error('Missing token in auth response');
    }

    return authResponse;
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse | ApiEnvelope<RegisterResponse>>('/api/auth/register', payload);
    return extractEnvelopeData(response.data);
  },

  async sendVerifyEmailOtpWhenNotLogin(payload: OtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/otp/send/verify-email',
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async sendVerifyEmailOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/me/otp/send/verify-email',
    );
    return extractEnvelopeData(response.data);
  },

  async sendChangeUsernameOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/me/otp/send/change-username',
    );
    return extractEnvelopeData(response.data);
  },

  async sendChangePhoneNumberOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/me/otp/send/change-phone-number',
    );
    return extractEnvelopeData(response.data);
  },

  async verifyChangeUsernameOtpWhenLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/me/otp/verify/change-username',
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyChangePhoneNumberOtpWhenLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/me/otp/verify/change-phone-number',
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyEmailOtpWhenNotLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/otp/verify/email',
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async sendResetPasswordOtpWhenNotLogin(payload: OtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/otp/send/reset-password',
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async sendResetPasswordOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/me/otp/send/reset-password',
    );
    return extractEnvelopeData(response.data);
  },

  async verifyResetPasswordOtpWhenNotLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/otp/verify/password',
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyResetPasswordOtpWhenLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      '/api/auth/me/otp/verify/password',
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async resetPassword(resetToken: string, payload: ResetPasswordRequest): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse | ApiEnvelope<MessageResponse>>('/api/auth/reset-password', payload, {
      headers: {
        'X-Reset-Token': resetToken,
      },
    });
    return extractEnvelopeData(response.data);
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },
};

