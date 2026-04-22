import { API_ENDPOINTS } from '@/shared/api/endpoints';
import { apiClient, javaApiClient } from '@/shared/api/apiClient';
import type { ApiEnvelope } from '@/shared/types/api';
import type { UpdateSecurityAccountRequestDto } from '@/features/user/api/dtos/request.dto';
import type {
  SecurityAccountInfoResponseDto,
  UserProfilePresenceResponseDto,
  UserResponseDto,
} from '@/features/user/api/dtos/response.dto';
import { mapPresenceToUser } from '@/features/user/api/mapper/mapper';
import type {
  FriendPresenceResult,
  SecurityAccountInfo,
  UpdateSecurityAccountRequest,
  User,
} from '@/features/user/types/contracts';

const { USERS, FRIENDSHIPS } = API_ENDPOINTS;

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiEnvelope<UserResponseDto>>(USERS.ME);
    const currentUser = response.data.data;

    if (!currentUser) {
      throw new Error(response.data.errors?.[0] ?? 'Failed to load current user');
    }

    return {
      ...currentUser,
      avatarUrl: currentUser.avatarUrl || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    };
  },

  async getSecurityAccountInfo(): Promise<SecurityAccountInfo> {
    const response = await apiClient.get<ApiEnvelope<SecurityAccountInfoResponseDto>>(USERS.SECURITY_ACCOUNT);
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

  async updateSecurityAccountInfo(
    resetToken: string,
    payload: UpdateSecurityAccountRequest,
  ): Promise<void> {
    await apiClient.patch(USERS.SECURITY_ACCOUNT, payload satisfies UpdateSecurityAccountRequestDto, {
      headers: {
        'X-Reset-Token': resetToken,
      },
    });
  },

  async getOnlineUsers(): Promise<User[]> {
    const response = await javaApiClient.get<UserResponseDto[]>(USERS.ONLINE);
    return response.data;
  },

  async getFriendPresence(): Promise<FriendPresenceResult> {
    const response = await apiClient.get<ApiEnvelope<UserProfilePresenceResponseDto[]>>(FRIENDSHIPS.PRESENCE);
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
