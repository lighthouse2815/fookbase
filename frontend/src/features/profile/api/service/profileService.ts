import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient, javaApiClient } from '@/shared/api/apiClient';
import { extractData } from '@/shared/api/httpResponse';

import type { ApiEnvelope } from '@/shared/types/api';
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
import type { SearchProfilesByPhoneNumberQueryDto } from '@/features/profile/api/dtos/request.dto';
import type {
  MyProfileSettingsResponseDto,
  ProfileInfoVisibilityResponseDto,
  ProfilePageInfoSettingsResponseDto,
  ProfileResponseDto,
  UserProfileSearchResultResponseDto,
} from '@/features/profile/api/dtos/response.dto';
import {
  mapCompleteMyProfileRequestToDto,
  mapMyProfileSettingsResponseDtoToMyProfileSettings,
  mapProfileInfoVisibilityResponseDtoToProfileInfoVisibility,
  mapProfilePageInfoSettingsResponseDtoToProfilePageInfoSettings,
  mapProfileResponseDtoToProfile,
  mapUpdateMyProfileRequestToDto,
  mapUpdateProfileInfoVisibilityRequestToDto,
  mapUserProfileSearchResultResponseDtoToUserProfileSearchResult,
} from '@/features/profile/api/mapper/mapper';

const { PROFILES } = API_ENDPOINTS;
const COMPLETE_MY_PROFILE_PATH = '/api/profiles/me/complete-profile';

export const profileService = {
  async getProfileById(profileId: string): Promise<Profile> {
    const response = await apiClient.get<ApiEnvelope<ProfileResponseDto>>(PROFILES.BY_ID(profileId));
    const profileDto = extractData(response.data, 'Failed to load profile');
    return mapProfileResponseDtoToProfile(profileDto, profileId);
  },

  async searchProfilesByPhoneNumber(phoneNumber: string): Promise<UserProfileSearchResult[]> {
    const params: SearchProfilesByPhoneNumberQueryDto = { phoneNumber };
    const response = await apiClient.get<ApiEnvelope<UserProfileSearchResultResponseDto[]>>(PROFILES.SEARCH, {
      params,
    });

    const resultDtos = response.data.data ?? [];
    return resultDtos.map(mapUserProfileSearchResultResponseDtoToUserProfileSearchResult);
  },

  async getMyProfileSettings(): Promise<MyProfileSettings> {
    const response = await apiClient.get<ApiEnvelope<MyProfileSettingsResponseDto>>(PROFILES.ME);
    const profileDto = extractData(response.data, 'Failed to load personal profile settings');
    return mapMyProfileSettingsResponseDtoToMyProfileSettings(profileDto);
  },

  async updateMyProfile(payload: UpdateMyProfileRequest): Promise<void> {
    await apiClient.patch(PROFILES.ME, mapUpdateMyProfileRequestToDto(payload));
  },

  async getMyProfilePageInfoSettings(): Promise<ProfilePageInfoSettings> {
    const response = await apiClient.get<ApiEnvelope<ProfilePageInfoSettingsResponseDto>>(PROFILES.ME_PAGE_INFO);
    const settingsDto = extractData(response.data, 'Failed to load profile page info settings');
    return mapProfilePageInfoSettingsResponseDtoToProfilePageInfoSettings(settingsDto);
  },

  async getMyProfilePageInfoVisibility(): Promise<ProfileInfoVisibility> {
    const response = await apiClient.get<ApiEnvelope<ProfileInfoVisibilityResponseDto>>(PROFILES.ME_PAGE_INFO_VISIBILITY);
    const visibilityDto = extractData(response.data, 'Failed to load profile page info visibility');
    return mapProfileInfoVisibilityResponseDtoToProfileInfoVisibility(visibilityDto);
  },

  async updateMyProfilePageInfoVisibility(payload: UpdateProfileInfoVisibilityRequest): Promise<void> {
    await apiClient.patch(PROFILES.ME_PAGE_INFO_VISIBILITY, mapUpdateProfileInfoVisibilityRequestToDto(payload));
  },

  async completeMyProfile(payload: CompleteMyProfileRequest): Promise<void> {
    await javaApiClient.post(COMPLETE_MY_PROFILE_PATH, mapCompleteMyProfileRequestToDto(payload));
  },
};


