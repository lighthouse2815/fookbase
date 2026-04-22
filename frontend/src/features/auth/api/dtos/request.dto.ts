export interface LoginRequestDto {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequestDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface OtpRequestDto {
  email: string;
  type: string;
}

export interface VerifyOtpRequestDto {
  email?: string;
  otp: string;
}

export interface ResetPasswordRequestDto {
  newPassword: string;
}
