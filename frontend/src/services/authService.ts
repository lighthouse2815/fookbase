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

const normalizeAuthPayload = (payload: RawAuthPayload): AuthResponse => {
  const token = normalizeToken(payload.token ?? payload.accessToken ?? payload.jwt);

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
    const authPayload = extractEnvelopeData(response.data);
    return normalizeAuthPayload(authPayload);
  },

  async loginAdmin(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<RawAuthPayload | ApiEnvelope<RawAuthPayload>>('/api/auth/admin/login', payload);
    const authPayload = extractEnvelopeData(response.data);
    return normalizeAuthPayload(authPayload);
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

