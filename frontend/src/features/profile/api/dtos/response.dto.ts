export interface ProfileResponseDto {
  id?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string;
  coverUrl?: string;
  friendsCount?: number;
  postsCount?: number;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  birthDate?: string;
  fullNameVisible?: boolean;
  phoneVisible?: boolean;
  emailVisible?: boolean;
  dateOfBirthVisible?: boolean;
  genderVisible?: boolean;
  friendCountVisible?: boolean;
  nickname?: string;
  status?: string;
  friendshipStatus?: string;
  userStatus?: string;
}

export interface UserProfileSearchResultResponseDto {
  userId?: string;
  id?: string;
  displayName?: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  status?: string | null;
}

export interface MyProfileSettingsResponseDto {
  userId?: string;
  username?: string;
  displayName?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
  gender?: string | null;
}

export interface ProfileInfoVisibilityResponseDto {
  fullNameVisible?: boolean;
  phoneVisible?: boolean;
  emailVisible?: boolean;
  dateOfBirthVisible?: boolean;
  genderVisible?: boolean;
  friendCountVisible?: boolean;
}

export interface ProfilePageInfoSettingsResponseDto {
  fullName?: string;
  phoneNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  friendCount?: number;
}
