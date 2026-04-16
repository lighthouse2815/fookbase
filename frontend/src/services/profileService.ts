import { apiClient, javaApiClient } from './apiClient';
import type { Profile } from '../types/profile';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface ProfilePayload {
  userId?: string | null;
  id?: string | null;
  username?: string | null;
  displayName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  coverUrl?: string | null;
  friendsCount?: number | null;
  postsCount?: number | null;
  phoneNumber?: string | null;
  email?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  fullNameVisible?: boolean | null;
  phoneVisible?: boolean | null;
  emailVisible?: boolean | null;
  dateOfBirthVisible?: boolean | null;
  genderVisible?: boolean | null;
  friendCountVisible?: boolean | null;
  nickname?: string | null;
  status?: string | null;
  userStatus?: string | null;
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

export interface CompleteMyProfileRequest {
  birthday: string;
  gender: string;
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

export const profileService = {
  async getProfileById(profileId: string): Promise<Profile> {
    const response = await apiClient.get<ApiEnvelope<ProfilePayload>>(`/api/profiles/${profileId}`);
    const profile = response.data.data;

    if (!profile) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load profile');
    }

    const resolvedId = profile.userId?.trim() || profile.id || profileId;

    return {
      id: resolvedId,
      username: profile.username?.trim() || undefined,
      displayName: profile.displayName?.trim() || 'user',
      fullName: profile.fullName?.trim() || undefined,
      avatarUrl: profile.avatarUrl || `https://i.pravatar.cc/150?u=${resolvedId}`,
      bio: profile.bio ?? undefined,
      coverUrl: profile.coverUrl ?? undefined,
      friendsCount: typeof profile.friendsCount === 'number' ? profile.friendsCount : 0,
      postsCount: typeof profile.postsCount === 'number' ? profile.postsCount : 0,
      phoneNumber: profile.phoneNumber?.trim() || undefined,
      email: profile.email?.trim() || undefined,
      gender: profile.gender?.trim() || undefined,
      birthDate: profile.birthDate?.trim() || undefined,
      fullNameVisible: profile.fullNameVisible ?? true,
      phoneVisible: profile.phoneVisible ?? true,
      emailVisible: profile.emailVisible ?? true,
      dateOfBirthVisible: profile.dateOfBirthVisible ?? true,
      genderVisible: profile.genderVisible ?? true,
      friendCountVisible: profile.friendCountVisible ?? true,
      nickname: profile.nickname?.trim() || undefined,
      friendshipStatus: profile.status?.trim()?.toUpperCase() || undefined,
      userStatus: profile.userStatus?.trim()?.toUpperCase() || undefined,
    };
  },

  async searchProfiles(keyword: string): Promise<UserProfileSearchResult[]> {
    const response = await apiClient.get<ApiEnvelope<UserProfileSearchResult[]>>('/api/profiles/search', {
      params: { keyword },
    });

    const results = response.data.data ?? [];

    return results.map((item) => ({
      ...item,
      phoneNumber: item.phoneNumber?.trim() || '',
      avatarUrl: item.avatarUrl || `https://i.pravatar.cc/150?u=${item.userId}`,
    }));
  },

  async searchProfilesByPhoneNumber(phoneNumber: string): Promise<UserProfileSearchResult[]> {
    return this.searchProfiles(phoneNumber);
  },

  async getMyProfileSettings(): Promise<MyProfileSettings> {
    const response = await apiClient.get<ApiEnvelope<MyProfileSettings>>('/api/profiles/me');
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
      avatarUrl: profile.avatarUrl || `https://i.pravatar.cc/150?u=${profile.userId}`,
    };
  },

  async updateMyProfile(payload: UpdateMyProfileRequest): Promise<void> {
    await apiClient.patch('/api/profiles/me', payload);
  },

  async completeMyProfile(payload: CompleteMyProfileRequest): Promise<void> {
    await javaApiClient.post('/api/profiles/me/complete-profile', payload);
  },

  async getMyProfilePageInfoSettings(): Promise<ProfilePageInfoSettings> {
    const response = await apiClient.get<ApiEnvelope<ProfilePageInfoSettings>>('/api/profiles/me/page-info');
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
    const response = await apiClient.get<ApiEnvelope<ProfileInfoVisibility>>('/api/profiles/me/page-info/visibility');
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
    await apiClient.patch('/api/profiles/me/page-info/visibility', payload);
  },
};

