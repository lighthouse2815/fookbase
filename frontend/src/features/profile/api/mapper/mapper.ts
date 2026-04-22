import type {
  CompleteMyProfileRequest,
  MyProfileSettings,
  Profile,
  ProfileInfoVisibility,
  ProfilePageInfoSettings,
  UpdateMyProfileRequest,
  UpdateProfileInfoVisibilityRequest,
  UserProfileSearchResult,
} from '@/features/profile/types/contracts';
import type {
  CompleteMyProfileRequestDto,
  UpdateMyProfileRequestDto,
  UpdateProfileInfoVisibilityRequestDto,
} from '@/features/profile/api/dtos/request.dto';
import type {
  MyProfileSettingsResponseDto,
  ProfileInfoVisibilityResponseDto,
  ProfilePageInfoSettingsResponseDto,
  ProfileResponseDto,
  UserProfileSearchResultResponseDto,
} from '@/features/profile/api/dtos/response.dto';

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';

const normalizeOptionalString = (value: string | null | undefined): string | null =>
  value?.trim() || null;

const normalizeRequiredString = (value: string | null | undefined, fallback: string): string => {
  const normalized = value?.trim();
  return normalized || fallback;
};

export const mapProfileResponseDtoToProfile = (dto: ProfileResponseDto, profileId: string): Profile => ({
  id: dto.id || dto.userId || profileId,
  userId: dto.userId,
  username: dto.username,
  displayName: normalizeRequiredString(dto.displayName, 'user'),
  fullName: dto.fullName,
  avatarUrl: normalizeRequiredString(dto.avatarUrl, DEFAULT_AVATAR_URL),
  bio: dto.bio,
  coverUrl: dto.coverUrl,
  friendsCount: typeof dto.friendsCount === 'number' ? dto.friendsCount : 0,
  postsCount: typeof dto.postsCount === 'number' ? dto.postsCount : 0,
  phoneNumber: dto.phoneNumber,
  email: dto.email,
  gender: dto.gender,
  birthDate: dto.birthDate,
  fullNameVisible: dto.fullNameVisible,
  phoneVisible: dto.phoneVisible,
  emailVisible: dto.emailVisible,
  dateOfBirthVisible: dto.dateOfBirthVisible,
  genderVisible: dto.genderVisible,
  friendCountVisible: dto.friendCountVisible,
  nickname: dto.nickname,
  status: dto.status,
  friendshipStatus: dto.friendshipStatus ?? dto.status,
  userStatus: dto.userStatus,
});

export const mapUserProfileSearchResultResponseDtoToUserProfileSearchResult = (
  dto: UserProfileSearchResultResponseDto,
  index: number,
): UserProfileSearchResult => ({
  userId: normalizeRequiredString(dto.userId ?? dto.id, `profile-search-${index}`),
  displayName: normalizeRequiredString(dto.displayName, 'user'),
  phoneNumber: normalizeRequiredString(dto.phoneNumber, ''),
  avatarUrl: normalizeRequiredString(dto.avatarUrl, DEFAULT_AVATAR_URL),
  status: normalizeOptionalString(dto.status),
});

export const mapMyProfileSettingsResponseDtoToMyProfileSettings = (
  dto: MyProfileSettingsResponseDto,
): MyProfileSettings => ({
  userId: normalizeRequiredString(dto.userId, 'me'),
  username: normalizeRequiredString(dto.username, 'user'),
  displayName: normalizeRequiredString(dto.displayName, 'user'),
  firstName: normalizeOptionalString(dto.firstName),
  lastName: normalizeOptionalString(dto.lastName),
  email: normalizeOptionalString(dto.email),
  phoneNumber: normalizeOptionalString(dto.phoneNumber),
  avatarUrl: normalizeRequiredString(dto.avatarUrl, DEFAULT_AVATAR_URL),
  birthDate: normalizeOptionalString(dto.birthDate),
  gender: normalizeOptionalString(dto.gender),
});

export const mapProfilePageInfoSettingsResponseDtoToProfilePageInfoSettings = (
  dto: ProfilePageInfoSettingsResponseDto,
): ProfilePageInfoSettings => ({
  fullName: normalizeRequiredString(dto.fullName, 'user'),
  phoneNumber: normalizeOptionalString(dto.phoneNumber),
  email: normalizeOptionalString(dto.email),
  dateOfBirth: normalizeOptionalString(dto.dateOfBirth),
  gender: normalizeOptionalString(dto.gender),
  friendCount: typeof dto.friendCount === 'number' ? dto.friendCount : 0,
});

export const mapProfileInfoVisibilityResponseDtoToProfileInfoVisibility = (
  dto: ProfileInfoVisibilityResponseDto,
): ProfileInfoVisibility => ({
  fullNameVisible: dto.fullNameVisible ?? true,
  phoneVisible: dto.phoneVisible ?? true,
  emailVisible: dto.emailVisible ?? true,
  dateOfBirthVisible: dto.dateOfBirthVisible ?? true,
  genderVisible: dto.genderVisible ?? true,
  friendCountVisible: dto.friendCountVisible ?? true,
});

export const mapUpdateMyProfileRequestToDto = (payload: UpdateMyProfileRequest): UpdateMyProfileRequestDto => ({
  firstName: payload.firstName,
  lastName: payload.lastName,
  birthday: payload.birthday,
  gender: payload.gender,
  avatarUrl: payload.avatarUrl,
  displayName: payload.displayName,
});

export const mapUpdateProfileInfoVisibilityRequestToDto = (
  payload: UpdateProfileInfoVisibilityRequest,
): UpdateProfileInfoVisibilityRequestDto => ({
  fullNameVisible: payload.fullNameVisible,
  phoneVisible: payload.phoneVisible,
  emailVisible: payload.emailVisible,
  dateOfBirthVisible: payload.dateOfBirthVisible,
  genderVisible: payload.genderVisible,
  friendCountVisible: payload.friendCountVisible,
});

export const mapCompleteMyProfileRequestToDto = (
  payload: CompleteMyProfileRequest,
): CompleteMyProfileRequestDto => ({
  firstName: payload.firstName,
  lastName: payload.lastName,
  phoneNumber: payload.phoneNumber,
  birthday: payload.birthday,
  gender: payload.gender,
  avatarUrl: payload.avatarUrl,
  displayName: payload.displayName,
});

