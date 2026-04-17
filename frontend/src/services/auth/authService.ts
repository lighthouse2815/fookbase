import axios from 'axios';

import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import type { ApiEnvelope } from '@/interface/api';

const AUTH = API_CONFIG.ENDPOINTS.AUTH;
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
} from '@/interface/auth';

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

export class InactiveAccountError extends Error {
  readonly status = 'INACTIVE';
  readonly email?: string;

  constructor(email?: string) {
    super('Account inactive. Email verification required.');
    this.name = 'InactiveAccountError';
    this.email = email?.trim() || undefined;
  }
}

export class BannedAccountError extends Error {
  readonly status = 'BANNED';

  constructor(message = 'Account is banned.') {
    super(message);
    this.name = 'BannedAccountError';
  }
}

const toNormalizedText = (value: string | undefined): string => {
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

const extractApiErrorMessage = (error: unknown): string | undefined => {
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

const isBannedLoginMessage = (message: string | undefined): boolean => {
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
    let authPayload: RawAuthPayload;
    try {
      const response = await apiClient.post<RawAuthPayload | ApiEnvelope<RawAuthPayload>>(AUTH.LOGIN, payload);
      authPayload = extractEnvelopeData(response.data);
    } catch (error) {
      const errorMessage = extractApiErrorMessage(error);
      if (isBannedLoginMessage(errorMessage)) {
        throw new BannedAccountError(errorMessage ?? 'Account is banned.');
      }

      throw error;
    }

    const authResponse = normalizeAuthPayload(authPayload);

    if (authResponse) {
      return authResponse;
    }

    const accountStatus = normalizeStatus(authPayload.status);
    if (accountStatus === 'INACTIVE') {
      throw new InactiveAccountError(authPayload.email);
    }
    if (accountStatus === 'BANNED') {
      throw new BannedAccountError('Account is banned.');
    }

    throw new Error('Missing token in auth response');
  },

  async loginAdmin(payload: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<RawAuthPayload | ApiEnvelope<RawAuthPayload>>(AUTH.ADMIN_LOGIN, payload);
    const authPayload = extractEnvelopeData(response.data);
    const authResponse = normalizeAuthPayload(authPayload);

    if (!authResponse) {
      throw new Error('Missing token in auth response');
    }

    return authResponse;
  },

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse | ApiEnvelope<RegisterResponse>>(AUTH.REGISTER, payload);
    return extractEnvelopeData(response.data);
  },

  async sendVerifyEmailOtpWhenNotLogin(payload: OtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.OTP_SEND_VERIFY_EMAIL,
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async sendVerifyEmailOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.ME_OTP_SEND_VERIFY_EMAIL,
    );
    return extractEnvelopeData(response.data);
  },

  async sendChangeUsernameOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.ME_OTP_SEND_CHANGE_USERNAME,
    );
    return extractEnvelopeData(response.data);
  },

  async sendChangePhoneNumberOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.ME_OTP_SEND_CHANGE_PHONE_NUMBER,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyChangeUsernameOtpWhenLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.ME_OTP_VERIFY_CHANGE_USERNAME,
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyChangePhoneNumberOtpWhenLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.ME_OTP_VERIFY_CHANGE_PHONE_NUMBER,
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyEmailOtpWhenNotLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.OTP_VERIFY_EMAIL,
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async sendResetPasswordOtpWhenNotLogin(payload: OtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.OTP_SEND_RESET_PASSWORD,
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async sendResetPasswordOtpWhenLogin(): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.ME_OTP_SEND_RESET_PASSWORD,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyResetPasswordOtpWhenNotLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.OTP_VERIFY_PASSWORD,
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async verifyResetPasswordOtpWhenLogin(payload: VerifyOtpRequest): Promise<OtpVerifyResponse> {
    const response = await apiClient.post<OtpVerifyResponse | ApiEnvelope<OtpVerifyResponse>>(
      AUTH.ME_OTP_VERIFY_PASSWORD,
      payload,
    );
    return extractEnvelopeData(response.data);
  },

  async resetPassword(resetToken: string, payload: ResetPasswordRequest): Promise<MessageResponse> {
    const response = await apiClient.post<MessageResponse | ApiEnvelope<MessageResponse>>(AUTH.RESET_PASSWORD, payload, {
      headers: {
        'X-Reset-Token': resetToken,
      },
    });
    return extractEnvelopeData(response.data);
  },

  async logout(): Promise<void> {
    await apiClient.post(AUTH.LOGOUT);
  },
};
