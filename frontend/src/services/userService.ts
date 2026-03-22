import { apiClient, javaApiClient } from './apiClient';
import type { User } from '../types/user';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiEnvelope<User>>('/api/users/me');
    const currentUser = response.data.data;

    if (!currentUser) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load current user');
    }

    return {
      ...currentUser,
      avatarUrl: currentUser.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`,
    };
  },

  async getOnlineUsers(): Promise<User[]> {
    const response = await javaApiClient.get<User[]>('/api/users/online');
    return response.data;
  },
};

