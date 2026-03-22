import { javaApiClient } from './apiClient';
import type { FriendSuggestion, Friendship } from '../types/friendship';

export const friendshipService = {
  async getFriendSuggestions(): Promise<FriendSuggestion[]> {
    const response = await javaApiClient.get<FriendSuggestion[]>('/api/friendships/suggestions');
    return response.data;
  },

  async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const response = await javaApiClient.post<Friendship>('/api/friendships/request', {
      addresseeId,
    });

    return response.data;
  },
};

