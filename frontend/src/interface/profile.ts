

export interface Profile {
  id: string;
  username?: string;
  displayName: string;
  fullName?: string;
  avatarUrl: string;
  bio?: string;
  coverUrl?: string;
  friendsCount: number;
  postsCount: number;
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
  friendshipStatus?: string;
  userStatus?: string;
}

export interface UserProfileSearchResult {
  userId: string;
  displayName: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  status?: string | null;
}

export interface MyProfileSettings {
  userId: string;
  username: string;
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
  gender?: string | null;
}

export interface UpdateMyProfileRequest {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  gender?: string;
  avatarUrl?: string;
  displayName?: string;
}

export interface ProfileInfoVisibility {
  fullNameVisible: boolean;
  phoneVisible: boolean;
  emailVisible: boolean;
  dateOfBirthVisible: boolean;
  genderVisible: boolean;
  friendCountVisible: boolean;
}

export interface ProfilePageInfoSettings {
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  friendCount: number;
}

export interface UpdateProfileInfoVisibilityRequest {
  fullNameVisible: boolean;
  phoneVisible: boolean;
  emailVisible: boolean;
  dateOfBirthVisible: boolean;
  genderVisible: boolean;
  friendCountVisible: boolean;
}

export interface CompleteMyProfileRequest {
  birthday: string;
  gender: string;
  avatarUrl?: string;
  displayName?: string;
}