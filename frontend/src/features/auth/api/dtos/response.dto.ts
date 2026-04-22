export interface AuthUserDto {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface RawAuthPayloadDto {
  token?: string;
  accessToken?: string;
  jwt?: string;
  status?: string;
  user?: AuthUserDto;
  userId?: string;
  username?: string;
  displayName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  avatarUrl?: string;
  profileCompleted?: boolean;
  isNew?: boolean;
}

export interface RegisterResponseDto {
  username: string;
  message: string;
}

export interface OtpVerifyResponseDto {
  result: string;
}

export interface MessageResponseDto {
  message: string;
}
