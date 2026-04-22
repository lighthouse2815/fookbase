import { apiClient } from '@/shared/api/apiClient';
import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { extractEnvelopeData } from '@/shared/api/httpResponse';
import type { ApiEnvelope } from '@/shared/types/api';
import type {
  AuthSession,
  LoginInput,
  MessageResult,
  OtpInput,
  OtpVerifyResult,
  RegisterInput,
  RegisterResult,
  ResetPasswordInput,
  VerifyOtpInput,
} from '@/features/auth/types/contracts';
import { extractAuthApiErrorInfo } from '@/features/auth/utils/error.util';
import { BannedAccountError } from '@/features/auth/errors/BannedAccountError';
import { InactiveAccountError } from '@/features/auth/errors/InactiveAccountError';
import {
  mapLoginInputToDto,
  mapMessageResponseDtoToResult,
  mapOtpInputToDto,
  mapOtpVerifyResponseDtoToResult,
  mapRawAuthPayloadDtoToAuthSession,
  mapRawAuthPayloadDtoToLoginResolution,
  mapRegisterInputToDto,
  mapRegisterResponseDtoToResult,
  mapResetPasswordInputToDto,
  mapVerifyOtpInputToDto,
} from '@/features/auth/api/mapper/mapper';
import type {
  MessageResponseDto,
  OtpVerifyResponseDto,
  RawAuthPayloadDto,
  RegisterResponseDto,
} from '@/features/auth/api/dtos/response.dto';

const AUTH = API_ENDPOINTS.AUTH;

const resolveLoginSession = (
  payload: RawAuthPayloadDto,
  mode: 'local' | 'google',
): AuthSession => {
  const resolution = mapRawAuthPayloadDtoToLoginResolution(payload, mode);

  if (resolution.kind === 'session') {
    return resolution.session;
  }

  if (resolution.kind === 'inactive') {
    throw new InactiveAccountError(resolution.email);
  }

  if (resolution.kind === 'banned') {
    throw new BannedAccountError('Account is banned.');
  }

  throw new Error(`Missing token in ${mode === 'google' ? 'Google auth' : 'auth'} response`);
};

const rethrowLoginError = (error: unknown): never => {
  const { status, message } = extractAuthApiErrorInfo(error);
  if (status === 403) {
        throw new BannedAccountError(message ?? 'Account is banned.');
  }

  throw error;
};

export const authService = {
  async login(payload: LoginInput): Promise<AuthSession> {
    try {
      const response = await apiClient.post<RawAuthPayloadDto | ApiEnvelope<RawAuthPayloadDto>>(
        AUTH.LOGIN,
        mapLoginInputToDto(payload),
      );
      const authPayload = extractEnvelopeData(response.data);
      return resolveLoginSession(authPayload, 'local');
    } catch (error) {
      rethrowLoginError(error);
      throw error;
    }
  },

  async loginAdmin(payload: LoginInput): Promise<AuthSession> {
    const response = await apiClient.post<RawAuthPayloadDto | ApiEnvelope<RawAuthPayloadDto>>(
      AUTH.ADMIN_LOGIN,
      mapLoginInputToDto(payload),
    );
    const authPayload = extractEnvelopeData(response.data);
    const authSession = mapRawAuthPayloadDtoToAuthSession(authPayload);

    if (!authSession) {
      throw new Error('Missing token in auth response');
    }

    return authSession;
  },

  async authWithGoogle(tokenId: string): Promise<AuthSession> {
    try {
      const response = await apiClient.post<RawAuthPayloadDto | ApiEnvelope<RawAuthPayloadDto>>(
        AUTH.GOOGLE,
        { tokenId },
      );
      const authPayload = extractEnvelopeData(response.data);
      return resolveLoginSession(authPayload, 'google');
    } catch (error) {
      rethrowLoginError(error);
      throw error;
    }
  },

  async register(payload: RegisterInput): Promise<RegisterResult> {
    const response = await apiClient.post<RegisterResponseDto | ApiEnvelope<RegisterResponseDto>>(
      AUTH.REGISTER,
      mapRegisterInputToDto(payload),
    );
    return mapRegisterResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async sendVerifyEmailOtpWhenNotLogin(payload: OtpInput): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.OTP_SEND_VERIFY_EMAIL,
      mapOtpInputToDto(payload),
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async sendVerifyEmailOtpWhenLogin(): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.ME_OTP_SEND_VERIFY_EMAIL,
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async sendChangeUsernameOtpWhenLogin(): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.ME_OTP_SEND_CHANGE_USERNAME,
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async sendChangePhoneNumberOtpWhenLogin(): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.ME_OTP_SEND_CHANGE_PHONE_NUMBER,
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async verifyChangeUsernameOtpWhenLogin(payload: VerifyOtpInput): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.ME_OTP_VERIFY_CHANGE_USERNAME,
      mapVerifyOtpInputToDto(payload),
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async verifyChangePhoneNumberOtpWhenLogin(payload: VerifyOtpInput): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.ME_OTP_VERIFY_CHANGE_PHONE_NUMBER,
      mapVerifyOtpInputToDto(payload),
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async verifyEmailOtpWhenNotLogin(payload: VerifyOtpInput): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.OTP_VERIFY_EMAIL,
      mapVerifyOtpInputToDto(payload),
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async sendResetPasswordOtpWhenNotLogin(payload: OtpInput): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.OTP_SEND_RESET_PASSWORD,
      mapOtpInputToDto(payload),
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async sendResetPasswordOtpWhenLogin(): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.ME_OTP_SEND_RESET_PASSWORD,
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async verifyResetPasswordOtpWhenNotLogin(payload: VerifyOtpInput): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.OTP_VERIFY_PASSWORD,
      mapVerifyOtpInputToDto(payload),
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async verifyResetPasswordOtpWhenLogin(payload: VerifyOtpInput): Promise<OtpVerifyResult> {
    const response = await apiClient.post<OtpVerifyResponseDto | ApiEnvelope<OtpVerifyResponseDto>>(
      AUTH.ME_OTP_VERIFY_PASSWORD,
      mapVerifyOtpInputToDto(payload),
    );
    return mapOtpVerifyResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async resetPassword(resetToken: string, payload: ResetPasswordInput): Promise<MessageResult> {
    const response = await apiClient.post<MessageResponseDto | ApiEnvelope<MessageResponseDto>>(
      AUTH.RESET_PASSWORD,
      mapResetPasswordInputToDto(payload),
      {
        headers: {
          'X-Reset-Token': resetToken,
        },
      },
    );
    return mapMessageResponseDtoToResult(extractEnvelopeData(response.data));
  },

  async logout(): Promise<void> {
    await apiClient.post(AUTH.LOGOUT);
  },
};

