import { API_CONFIG } from '@/config/apiConfig';
import { apiClient, javaApiClient } from '@/services/apiClient';

import type { Profile } from '@/interface/profile';
import type { ApiEnvelope } from '@/interface/api';
import type {
  UserProfileSearchResult,
  MyProfileSettings,
  UpdateMyProfileRequest,
  ProfileInfoVisibility,
  ProfilePageInfoSettings,
  UpdateProfileInfoVisibilityRequest,
  CompleteMyProfileRequest,
} from '@/interface/profile';
const { PROFILES } = API_CONFIG.ENDPOINTS;

export const profileService = {
  async getProfileById(profileId: string): Promise<Profile> {
    const response = await apiClient.get<ApiEnvelope<Profile>>(PROFILES.BY_ID(profileId));
    const profile = response.data.data;

    if (!profile) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load profile');
    }

    return {
      ...profile,
      avatarUrl: profile.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    };
  },

  async searchProfilesByPhoneNumber(phoneNumber: string): Promise<UserProfileSearchResult[]> {
    const response = await apiClient.get<ApiEnvelope<UserProfileSearchResult[]>>(PROFILES.SEARCH, {
      params: { phoneNumber },
    });

    const results = response.data.data ?? [];

    return results.map((item) => ({
      ...item,
      avatarUrl: item.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    }));
  },

  async getMyProfileSettings(): Promise<MyProfileSettings> {
    const response = await apiClient.get<ApiEnvelope<MyProfileSettings>>(PROFILES.ME);
    const profile = response.data.data;

    if (!profile) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load personal profile settings');
    }

    return {
      ...profile,
      username: profile.username?.trim() || 'user',
      displayName: profile.displayName?.trim() || 'user',
      firstName: profile.firstName?.trim() || null,
      lastName: profile.lastName?.trim() || null,
      email: profile.email?.trim() || null,
      phoneNumber: profile.phoneNumber?.trim() || null,
      birthDate: profile.birthDate?.trim() || null,
      gender: profile.gender?.trim() || null,
      avatarUrl: profile.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    };
  },

  async updateMyProfile(payload: UpdateMyProfileRequest): Promise<void> {
    await apiClient.patch(PROFILES.ME, payload);
  },

  async getMyProfilePageInfoSettings(): Promise<ProfilePageInfoSettings> {
    const response = await apiClient.get<ApiEnvelope<ProfilePageInfoSettings>>(PROFILES.ME_PAGE_INFO);
    const settings = response.data.data;

    if (!settings) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load profile page info settings');
    }

    return {
      ...settings,
      fullName: settings.fullName?.trim() || 'user',
      phoneNumber: settings.phoneNumber?.trim() || null,
      email: settings.email?.trim() || null,
      dateOfBirth: settings.dateOfBirth?.trim() || null,
      gender: settings.gender?.trim() || null,
      friendCount: typeof settings.friendCount === 'number' ? settings.friendCount : 0,
    };
  },

  async getMyProfilePageInfoVisibility(): Promise<ProfileInfoVisibility> {
    const response = await apiClient.get<ApiEnvelope<ProfileInfoVisibility>>(PROFILES.ME_PAGE_INFO_VISIBILITY);
    const visibility = response.data.data;

    if (!visibility) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load profile page info visibility');
    }

    return {
      fullNameVisible: visibility.fullNameVisible ?? true,
      phoneVisible: visibility.phoneVisible ?? true,
      emailVisible: visibility.emailVisible ?? true,
      dateOfBirthVisible: visibility.dateOfBirthVisible ?? true,
      genderVisible: visibility.genderVisible ?? true,
      friendCountVisible: visibility.friendCountVisible ?? true,
    };
  },

  async updateMyProfilePageInfoVisibility(payload: UpdateProfileInfoVisibilityRequest): Promise<void> {
    await apiClient.patch(PROFILES.ME_PAGE_INFO_VISIBILITY, payload);
  },
  async completeMyProfile(payload: CompleteMyProfileRequest): Promise<void> {
    await javaApiClient.post('/api/profiles/me/complete-profile', payload);
  },




};

