export interface UserResponseDto {
  id: string;
  username: string;
  displayName?: string;
  fullName: string;
  email?: string;
  avatarUrl: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  faculty?: string;
}

export interface CurrentUserResponseDto {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface SecurityAccountInfoResponseDto {
  username?: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface UserProfilePresenceResponseDto {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string | null;
}
