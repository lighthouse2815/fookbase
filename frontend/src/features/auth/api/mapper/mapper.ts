import type {
  LoginInput,
  OtpInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyOtpInput,
  MessageResult,
  OtpVerifyResult,
  RegisterResult,
  AuthSession,
  CompleteProfileMode,
  CompleteProfilePrefill,
} from '@/features/auth/types/contracts';
import type {
  LoginRequestDto,
  OtpRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  VerifyOtpRequestDto,
} from '@/features/auth/api/dtos/request.dto';

import type {
  MessageResponseDto,
  OtpVerifyResponseDto,
  RawAuthPayloadDto,
  RegisterResponseDto,
} from '@/features/auth/api/dtos/response.dto';

export const mapLoginInputToDto = (input: LoginInput): LoginRequestDto => ({
  username: input.username,
  password: input.password,
  rememberMe: input.rememberMe,
});

export const mapRegisterInputToDto = (input: RegisterInput): RegisterRequestDto => ({
  username: input.username,
  email: input.email,
  password: input.password,
  firstName: input.firstName,
  lastName: input.lastName,
});

export const mapOtpInputToDto = (input: OtpInput): OtpRequestDto => ({
  email: input.email,
  type: input.type,
});

export const mapVerifyOtpInputToDto = (input: VerifyOtpInput): VerifyOtpRequestDto => ({
  email: input.email,
  otp: input.otp,
});

export const mapResetPasswordInputToDto = (input: ResetPasswordInput): ResetPasswordRequestDto => ({
  newPassword: input.newPassword,
});

export const mapRegisterResponseDtoToResult = (dto: RegisterResponseDto): RegisterResult => ({
  username: dto.username,
  message: dto.message,
});

export const mapOtpVerifyResponseDtoToResult = (dto: OtpVerifyResponseDto): OtpVerifyResult => ({
  result: dto.result,
});

export const mapMessageResponseDtoToResult = (dto: MessageResponseDto): MessageResult => ({
  message: dto.message,
});

const normalizeAuthStatus = (status: string | undefined): string | undefined => {
  if (!status) {
    return undefined;
  }

  const normalizedStatus = status.trim().toUpperCase();
  return normalizedStatus || undefined;
};

const mapRawAuthPayloadDtoToCompleteProfilePrefill = (payload: RawAuthPayloadDto): CompleteProfilePrefill => ({
  displayName: payload.displayName?.trim() || undefined,
  firstName: payload.firstName?.trim() || undefined,
  lastName: payload.lastName?.trim() || undefined,
  email: payload.email?.trim() || undefined,
  phoneNumber: payload.phoneNumber?.trim() || undefined,
  avatarUrl: payload.avatarUrl?.trim() || undefined,
  birthDate: payload.birthDate?.trim() || undefined,
  gender: normalizeAuthStatus(payload.gender),
});

const normalizeBearerToken = (token: string | undefined): string | undefined => {
  if (!token) {
    return undefined;
  }

  const normalized = token.replace(/^Bearer\s+/i, '').trim();
  return normalized || undefined;
};

export const mapRawAuthPayloadDtoToAuthSession = (payload: RawAuthPayloadDto): AuthSession | null => {
  const normalizedToken = payload.token ?? payload.accessToken ?? payload.jwt;
  const token = normalizeBearerToken(normalizedToken);

  if (!token) {
    return null;
  }

  return {
    token,
    user:
      payload.user ?? {
        id: payload.userId ?? 'unknown',
        username: payload.username ?? payload.displayName ?? 'user',
        email: payload.email ?? '',
        avatarUrl: payload.avatarUrl,
      },
    profileCompleted: payload.profileCompleted ?? true,
  };
};

export type LoginPayloadResolution =
  | { kind: 'session'; session: AuthSession }
  | { kind: 'inactive'; email?: string }
  | { kind: 'banned' }
  | { kind: 'invalid' };

export const mapRawAuthPayloadDtoToLoginResolution = (
  payload: RawAuthPayloadDto,
  mode: CompleteProfileMode,
): LoginPayloadResolution => {
  const authSession = mapRawAuthPayloadDtoToAuthSession(payload);
  if (authSession) {
    return {
      kind: 'session',
      session: {
        ...authSession,
        completeProfileMode: mode,
        completeProfilePrefill: mapRawAuthPayloadDtoToCompleteProfilePrefill(payload),
      },
    };
  }

  const accountStatus = normalizeAuthStatus(payload.status);
  if (accountStatus === 'INACTIVE') {
    return {
      kind: 'inactive',
      email: payload.email?.trim() || undefined,
    };
  }

  if (accountStatus === 'BANNED') {
    return { kind: 'banned' };
  }

  return { kind: 'invalid' };
};
