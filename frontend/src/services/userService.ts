import { apiClient, javaApiClient } from './apiClient';
import type { User } from '../types/user';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface UserProfilePresencePayload {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string | null;
}

export interface FriendPresenceResult {
  onlineUsers: User[];
  offlineUsers: User[];
}

export interface SecurityAccountInfo {
  username: string;
}

const mapPresenceToUser = (payload: UserProfilePresencePayload): User => {
  const id = payload.userId;
  const displayName = payload.displayName?.trim() || 'user';

  return {
    id,
    username: displayName,
    fullName: displayName,
    avatarUrl: payload.avatarUrl?.trim() || `https://i.pravatar.cc/150?u=${id}`,
    isOnline: payload.isOnline,
    lastSeenAt: payload.lastSeenAt ?? undefined,
  };
};

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

  async getSecurityAccountInfo(): Promise<SecurityAccountInfo> {
    const response = await apiClient.get<ApiEnvelope<SecurityAccountInfo>>('/api/users/me/security-account');
    const accountInfo = response.data.data;

    if (!accountInfo) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load account security information');
    }

    return {
      username: accountInfo.username?.trim() || 'user',
    };
  },

  async getOnlineUsers(): Promise<User[]> {
    const response = await javaApiClient.get<User[]>('/api/users/online');
    return response.data;
  },

  async getFriendPresence(): Promise<FriendPresenceResult> {
    const response = await apiClient.get<ApiEnvelope<UserProfilePresencePayload[]>>('/api/friendships/presence');
    const payload = response.data.data;
    if (!payload) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load friend presence list.');
    }

    const users = payload.map(mapPresenceToUser);
    return {
      onlineUsers: users.filter((user) => user.isOnline),
      offlineUsers: users.filter((user) => !user.isOnline),
    };
  },
};

