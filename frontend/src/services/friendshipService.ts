import { javaApiClient } from './apiClient';
import type { FriendRequest, FriendSuggestion, Friendship, FriendUser } from '../types/friendship';

interface RequestCandidate {
  method: 'get' | 'post' | 'delete';
  path: string;
  data?: unknown;
}

const requestFromCandidates = async <T>(candidates: RequestCandidate[]): Promise<T> => {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const response = await javaApiClient.request<T>({
        method: candidate.method,
        url: candidate.path,
        data: candidate.data,
      });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('No matching friendship endpoint responded successfully.');
};

export const friendshipService = {
  async getFriendSuggestions(): Promise<FriendSuggestion[]> {
    return requestFromCandidates<FriendSuggestion[]>([
      { method: 'get', path: '/api/friendships/suggestions' },
      { method: 'get', path: '/api/friends/suggestions' },
    ]);
  },

  async getReceivedRequests(): Promise<FriendRequest[]> {
    return requestFromCandidates<FriendRequest[]>([
      { method: 'get', path: '/api/friendships/requests/received' },
      { method: 'get', path: '/api/friendships/received' },
      { method: 'get', path: '/api/friends/requests/received' },
    ]);
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    return requestFromCandidates<FriendRequest[]>([
      { method: 'get', path: '/api/friendships/requests/sent' },
      { method: 'get', path: '/api/friendships/sent' },
      { method: 'get', path: '/api/friends/requests/sent' },
    ]);
  },

  async getFriends(): Promise<FriendUser[]> {
    return requestFromCandidates<FriendUser[]>([
      { method: 'get', path: '/api/friendships/friends' },
      { method: 'get', path: '/api/friends' },
    ]);
  },

  async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    return requestFromCandidates<Friendship>([
      {
        method: 'post',
        path: '/api/friendships/request',
        data: { addresseeId },
      },
      {
        method: 'post',
        path: '/api/friends/request',
        data: { addresseeId },
      },
    ]);
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: `/api/friendships/requests/${requestId}/accept` },
      { method: 'post', path: `/api/friendships/${requestId}/accept` },
      { method: 'post', path: '/api/friendships/accept', data: { requestId } },
    ]);
  },

  async deleteFriendRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'delete', path: `/api/friendships/requests/${requestId}` },
      { method: 'delete', path: `/api/friendships/${requestId}` },
      { method: 'post', path: '/api/friendships/reject', data: { requestId } },
    ]);
  },

  async cancelSentRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'delete', path: `/api/friendships/requests/${requestId}/cancel` },
      { method: 'delete', path: `/api/friendships/requests/${requestId}` },
      { method: 'post', path: '/api/friendships/cancel', data: { requestId } },
    ]);
  },

  async unfriend(friendId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'delete', path: `/api/friendships/friends/${friendId}` },
      { method: 'delete', path: `/api/friends/${friendId}` },
      { method: 'post', path: '/api/friendships/unfriend', data: { friendId } },
    ]);
  },
};

