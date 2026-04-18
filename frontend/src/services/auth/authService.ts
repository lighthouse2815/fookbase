import { API_CONFIG } from '@/config/apiConfig';
import { apiClient } from '@/services/apiClient';
import { extractEnvelopeData } from '@/services/util';
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
import type { RawAuthPayload } from '@/services/auth/interface';
import {
  extractApiErrorMessage,
  isBannedLoginMessage,
  normalizeAuthPayload,
  normalizeStatus,
} from '@/services/auth/util';

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
