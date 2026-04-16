export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  profileCompleted?: boolean;
}

export interface RegisterResponse {
  username: string;
  message: string;
}

export interface OtpRequest {
  email: string;
  type: string;
}

export interface VerifyOtpRequest {
  email?: string;
  otp: string;
}

export interface OtpVerifyResponse {
  result: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}
