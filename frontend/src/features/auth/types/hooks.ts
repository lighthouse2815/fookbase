export interface LoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginOtpFormValues {
  otp: string;
}

export interface LoginLocationState {
  from?: { pathname?: string };
  message?: string;
}

export interface RegisterFormValues {
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface RegisterOtpFormValues {
  otp: string;
}

export interface ForgotPasswordEmailFormValues {
  email: string;
}

export interface ForgotPasswordOtpFormValues {
  otp: string;
}

export interface ForgotPasswordResetFormValues {
  newPassword: string;
  confirmNewPassword: string;
}

export interface AdminLoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface AdminLoginLocationState {
  from?: { pathname?: string };
  message?: string;
}

export type LoginStep = 'login' | 'otp' | 'banned';

export type RegisterStep = 'register' | 'otp';

export type ForgotPasswordStep = 'email' | 'otp' | 'reset';
