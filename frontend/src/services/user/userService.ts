import { API_CONFIG } from '@/config/apiConfig';
import { apiClient, javaApiClient } from '@/services/apiClient';
import type {
  User,
  FriendPresenceResult,
  SecurityAccountInfo,
  UpdateSecurityAccountRequest,
} from '@/interface/user';
import type { ApiEnvelope } from '@/interface/api';
import type { UserProfilePresencePayload } from '@/services/user/interface';
import { mapPresenceToUser } from '@/services/user/util';

const { USERS, FRIENDSHIPS } = API_CONFIG.ENDPOINTS;

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiEnvelope<User>>(USERS.ME);
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
    const response = await apiClient.get<ApiEnvelope<SecurityAccountInfo>>(USERS.SECURITY_ACCOUNT);
    const accountInfo = response.data.data;

    if (!accountInfo) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load account security information');
    }

    return {
      username: accountInfo.username?.trim() || 'user',
      email: accountInfo.email?.trim() || null,
      phoneNumber: accountInfo.phoneNumber?.trim() || null,
    };
  },

  async updateSecurityAccountInfo(payload: UpdateSecurityAccountRequest): Promise<void> {
    await apiClient.patch(USERS.SECURITY_ACCOUNT, payload);
  },

  async getOnlineUsers(): Promise<User[]> {
    const response = await javaApiClient.get<User[]>(USERS.ONLINE);
    return response.data;
  },

  async getFriendPresence(): Promise<FriendPresenceResult> {
    const response = await apiClient.get<ApiEnvelope<UserProfilePresencePayload[]>>(FRIENDSHIPS.PRESENCE);
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

