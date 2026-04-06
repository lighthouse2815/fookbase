import { apiClient } from './apiClient';
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
  avatarUrl?: string | null;
  bio?: string | null;
  coverUrl?: string | null;
  friendsCount?: number | null;
  postsCount?: number | null;
  phoneNumber?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  nickname?: string | null;
  status?: string | null;
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
      avatarUrl: profile.avatarUrl || `https://i.pravatar.cc/150?u=${resolvedId}`,
      bio: profile.bio ?? undefined,
      coverUrl: profile.coverUrl ?? undefined,
      friendsCount: typeof profile.friendsCount === 'number' ? profile.friendsCount : 0,
      postsCount: typeof profile.postsCount === 'number' ? profile.postsCount : 0,
      phoneNumber: profile.phoneNumber?.trim() || undefined,
      gender: profile.gender?.trim() || undefined,
      birthDate: profile.birthDate?.trim() || undefined,
      nickname: profile.nickname?.trim() || undefined,
      friendshipStatus: profile.status?.trim()?.toUpperCase() || undefined,
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

