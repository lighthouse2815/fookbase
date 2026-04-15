import axios from 'axios';
import { apiClient, javaApiClient } from './apiClient';
import type { FriendRequest, FriendSuggestion, Friendship, FriendshipStatus, FriendUser } from '../types/friendship';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  result?: T;
  errors?: string[];
  message?: string;
}

interface RequestCandidate {
  method: 'get' | 'post' | 'delete';
  path: string;
  data?: unknown;
  client?: 'csharp' | 'java';
}

interface PendingRequesterPayload {
  userId?: string;
  id?: string;
  username?: string;
  displayName?: string;
  fullName?: string;
  avatarUrl?: string;
  requester?: boolean;
  createdAt?: string;
  requestedAt?: string;
}

interface ContactPayload {
  contactId?: string;
  userId?: string;
  id?: string;
  username?: string;
  nickName?: string;
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  mutualFriends?: number;
  friendsCount?: number;
}

interface JavaFriendshipPayload {
  friendshipId?: string;
  id?: string;
  userId?: string;
  requesterId?: string;
  addresseeId?: string;
  status?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractEnvelopeData = <T>(payload: T | ApiEnvelope<T>): T => {
  if (!isRecord(payload)) {
    return payload as T;
  }

  if ('data' in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  if ('result' in payload && payload.result !== undefined) {
    const candidate = payload.result;
    if (Array.isArray(candidate) || isRecord(candidate)) {
      return candidate as T;
    }
  }

  return payload as T;
};

const toSafeId = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return fallback;
};

const toDisplayName = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return fallback;
};

const toAvatarUrl = (value: unknown, userId: string): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return `https://i.pravatar.cc/150?u=${userId}`;
};

const normalizeStatus = (value: unknown): FriendshipStatus => {
  const status = typeof value === 'string' ? value.toLowerCase() : '';
  if (status === 'accepted') {
    return 'accepted';
  }

  if (status === 'rejected') {
    return 'rejected';
  }

  return 'pending';
};

const requestFromCandidates = async <T>(candidates: RequestCandidate[]): Promise<T> => {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const client = candidate.client === 'java' ? javaApiClient : apiClient;
      const response = await client.request<T | ApiEnvelope<T>>({
        method: candidate.method,
        url: candidate.path,
        data: candidate.data,
      });
      return extractEnvelopeData<T>(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          throw error;
        }
      }

      lastError = error;
    }
  }

  throw lastError ?? new Error('No matching friendship endpoint responded successfully.');
};

let pendingRequestersPromise: Promise<PendingRequesterPayload[]> | null = null;

const getPendingRequestersFromJava = async (): Promise<PendingRequesterPayload[]> => {
  if (!pendingRequestersPromise) {
    pendingRequestersPromise = requestFromCandidates<PendingRequesterPayload[]>([
      { method: 'get', path: '/api/friendships/pending-requesters' },
    ]);
  }

  try {
    return await pendingRequestersPromise;
  } finally {
    pendingRequestersPromise = null;
  }
};

const mapPendingRequesterToRequest = (
  payload: PendingRequesterPayload,
  index: number,
  mode: 'received' | 'sent',
): FriendRequest => {
  const userId = toSafeId(payload.userId ?? payload.id, `friend-request-${index}`);
  const fullName = toDisplayName(
    payload.displayName ?? payload.fullName ?? payload.username,
    `User ${index + 1}`,
  );

  return {
    id: userId,
    requestId: userId,
    requesterId: mode === 'sent' ? 'me' : userId,
    addresseeId: mode === 'sent' ? userId : 'me',
    username: toDisplayName(payload.username, `user_${userId}`),
    fullName,
    avatarUrl: toAvatarUrl(payload.avatarUrl, userId),
    mutualFriends: 0,
    requestedAt:
      typeof payload.createdAt === 'string'
        ? payload.createdAt
        : typeof payload.requestedAt === 'string'
          ? payload.requestedAt
          : undefined,
  };
};

const mapContactToFriend = (payload: ContactPayload, index: number): FriendUser => {
  const userId = toSafeId(payload.userId ?? payload.id, `friend-${index}`);
  const displayName = toDisplayName(
    payload.fullName ?? payload.nickName ?? payload.username ?? payload.phoneNumber,
    `Friend ${index + 1}`,
  );

  return {
    id: userId,
    friendshipId: typeof payload.contactId === 'string' ? payload.contactId : undefined,
    username: toDisplayName(payload.username ?? payload.nickName ?? payload.phoneNumber, `friend_${userId}`),
    fullName: displayName,
    avatarUrl: toAvatarUrl(payload.avatarUrl, userId),
    mutualFriends: typeof payload.mutualFriends === 'number' ? payload.mutualFriends : 0,
    friendsCount: typeof payload.friendsCount === 'number' ? payload.friendsCount : undefined,
  };
};

const mapJavaFriendship = (payload: JavaFriendshipPayload, addresseeId: string): Friendship => {
  const requesterId = toSafeId(payload.requesterId ?? payload.userId, 'me');

  return {
    id: toSafeId(payload.friendshipId ?? payload.id, `friendship-${addresseeId}-${Date.now()}`),
    requesterId,
    addresseeId: toSafeId(payload.addresseeId, addresseeId),
    status: normalizeStatus(payload.status),
  };
};

export const friendshipService = {
  async getFriendSuggestions(): Promise<FriendSuggestion[]> {
    return requestFromCandidates<FriendSuggestion[]>([
      { method: 'get', path: '/api/friendships/suggestions' },
      { method: 'get', path: '/api/friends/suggestions' },
    ]);
  },

  async getReceivedRequests(): Promise<FriendRequest[]> {
    try {
      const pending = await getPendingRequestersFromJava();
      return pending
        // requester=true means current user is the sender.
        .filter((item) => item.requester !== true)
        .map((item, index) => mapPendingRequesterToRequest(item, index, 'received'));
    } catch {
      return requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: '/api/friendships/requests/received' },
        { method: 'get', path: '/api/friendships/received' },
        { method: 'get', path: '/api/friends/requests/received' },
      ]);
    }
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    try {
      const pending = await getPendingRequestersFromJava();
      return pending
        // requester=true means current user is the sender.
        .filter((item) => item.requester === true)
        .map((item, index) => mapPendingRequesterToRequest(item, index, 'sent'));
    } catch {
      return requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: '/api/friendships/requests/sent' },
        { method: 'get', path: '/api/friendships/sent' },
        { method: 'get', path: '/api/friends/requests/sent' },
      ]);
    }
  },

  async getFriends(): Promise<FriendUser[]> {
    try {
      const contacts = await requestFromCandidates<ContactPayload[]>([
        { method: 'get', path: '/api/friendships/contacts' },
      ]);
      return contacts.map(mapContactToFriend);
    } catch {
      return requestFromCandidates<FriendUser[]>([
        { method: 'get', path: '/api/friendships/friends' },
        { method: 'get', path: '/api/friends' },
      ]);
    }
  },

  async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const payload = await requestFromCandidates<JavaFriendshipPayload | Friendship>([
      {
        method: 'post',
        path: '/api/friendships/request',
        data: { addresseeId, userId: addresseeId },
      },
      {
        method: 'post',
        path: '/api/friends/request',
        data: { addresseeId },
      },
    ]);

    if (isRecord(payload)) {
      return mapJavaFriendship(payload as JavaFriendshipPayload, addresseeId);
    }

    return {
      id: `friendship-${addresseeId}-${Date.now()}`,
      requesterId: 'me',
      addresseeId,
      status: 'pending',
    };
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: '/api/friendships/accept', data: { requestId, userId: requestId } },
      { method: 'post', path: `/api/friendships/requests/${requestId}/accept` },
      { method: 'post', path: `/api/friendships/${requestId}/accept` },
    ]);
  },

  async deleteFriendRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: '/api/friendships/reject', data: { requestId, userId: requestId } },
      { method: 'delete', path: `/api/friendships/requests/${requestId}` },
      { method: 'delete', path: `/api/friendships/${requestId}` },
    ]);
  },

  async cancelSentRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: '/api/friendships/reject', data: { requestId, userId: requestId } },
      { method: 'delete', path: `/api/friendships/requests/${requestId}/cancel` },
      { method: 'delete', path: `/api/friendships/requests/${requestId}` },
      { method: 'post', path: '/api/friendships/cancel', data: { requestId } },
    ]);
  },

  async unfriend(friendId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: '/api/friendships/unfriend', data: { friendId, userId: friendId } },
      { method: 'delete', path: `/api/friendships/friends/${friendId}` },
      { method: 'delete', path: `/api/friends/${friendId}` },
    ]);
  },

  async blockUser(targetUserId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: '/api/friendships/block', data: { userId: targetUserId, targetUserId } },
      { method: 'post', path: `/api/friendships/block/${targetUserId}` },
      { method: 'post', path: `/api/messenger/friendships/block/${targetUserId}`, client: 'java' },
    ]);
  },

  async reportUser(targetUserId: string, reason: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: '/api/user-reports', data: { targetUserId, reason } },
      { method: 'post', path: '/api/reports/users', data: { userId: targetUserId, targetUserId, reason } },
      { method: 'post', path: `/api/profiles/${targetUserId}/report`, data: { reason } },
      { method: 'post', path: '/api/messenger/reports/users', data: { targetUserId, reason }, client: 'java' },
    ]);
  },
};

