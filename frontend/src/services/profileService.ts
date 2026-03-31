import { apiClient } from './apiClient';
import type { Profile } from '../types/profile';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  errors?: string[];
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

export const profileService = {
  async getProfileById(profileId: string): Promise<Profile> {
    const response = await apiClient.get<ApiEnvelope<Profile>>(`/api/profiles/${profileId}`);
    const profile = response.data.data;

    if (!profile) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load profile');
    }

    return {
      ...profile,
      avatarUrl: profile.avatarUrl || `https://i.pravatar.cc/150?u=${profile.id}`,
    };
  },

  async searchProfilesByPhoneNumber(phoneNumber: string): Promise<UserProfileSearchResult[]> {
    const response = await apiClient.get<ApiEnvelope<UserProfileSearchResult[]>>('/api/profiles/search', {
      params: { phoneNumber },
    });

    const results = response.data.data ?? [];

    return results.map((item) => ({
      ...item,
      avatarUrl: item.avatarUrl || `https://i.pravatar.cc/150?u=${item.userId}`,
    }));
  },

  async getMyProfileSettings(): Promise<MyProfileSettings> {
    const response = await apiClient.get<ApiEnvelope<MyProfileSettings>>('/api/profiles/me');
    const profile = response.data.data;

    if (!profile) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load personal profile settings');
    }

    return {
      ...profile,
      avatarUrl: profile.avatarUrl || `https://i.pravatar.cc/150?u=${profile.userId}`,
    };
  },

  async updateMyProfile(payload: UpdateMyProfileRequest): Promise<void> {
    await apiClient.patch('/api/profiles/me', payload);
  },
};

