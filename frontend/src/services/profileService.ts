import { apiClient } from './apiClient';
import type { Profile } from '../types/profile';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  errors?: string[];
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
};

