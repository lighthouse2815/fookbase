export interface SearchProfilesByPhoneNumberQueryDto {
  phoneNumber: string;
}

export interface SearchProfilesByKeywordQueryDto {
  keyword: string;
}

export interface UpdateMyProfileRequestDto {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  gender?: string;
  avatarUrl?: string;
  displayName?: string;
}

export interface UpdateProfileInfoVisibilityRequestDto {
  fullNameVisible: boolean;
  phoneVisible: boolean;
  emailVisible: boolean;
  dateOfBirthVisible: boolean;
  genderVisible: boolean;
  friendCountVisible: boolean;
}

export interface CompleteMyProfileRequestDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  birthday: string;
  gender: string;
  avatarUrl?: string;
  displayName?: string;
}
