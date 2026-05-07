export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  avatarUrl?: string;
}

export type CompleteProfileMode = 'local' | 'google';

export interface CompleteProfilePrefill {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  birthDate?: string;
  gender?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  profileCompleted: boolean;
  completeProfileMode?: CompleteProfileMode;
  completeProfilePrefill?: CompleteProfilePrefill;
}

export interface LoginInput {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface OtpInput {
  email: string;
  type: string;
}

export interface VerifyOtpInput {
  email?: string;
  otp: string;
}

export interface ResetPasswordInput {
  newPassword: string;
}

export interface RegisterResult {
  username: string;
  message: string;
}

export interface OtpVerifyResult {
  result: string;
}

export interface MessageResult {
  message: string;
}
