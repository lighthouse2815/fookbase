import axios from 'axios';
import { API_CONFIG } from '@/config/apiConfig';

import { apiClient } from '@/services/apiClient';

import type { ApiEnvelope } from '@/interface/api';

import type { 
  FriendRequest, 
  FriendSuggestion, 
  Friendship, 
  FriendshipStatus, 
  FriendUser,
  RequestCandidate,
  PendingRequesterPayload,
  ContactPayload,
  JavaFriendshipPayload 
} from '@/interface/friendship';

const FW = API_CONFIG.ENDPOINTS.FRIENDSHIPS;




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
      const response = await apiClient.request<T | ApiEnvelope<T>>({
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
      { method: 'get', path: FW.PENDING_REQUESTERS },
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
      { method: 'get', path: FW.SUGGESTIONS },
      { method: 'get', path: FW.FRIENDS_SUGGESTIONS },
    ]);
  },

  async getReceivedRequests(): Promise<FriendRequest[]> {
    try {
      const pending = await getPendingRequestersFromJava();
      return pending
        .filter((item) => item.requester !== true)
        .map((item, index) => mapPendingRequesterToRequest(item, index, 'received'));
    } catch {
      return requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: FW.REQUESTS_RECEIVED },
        { method: 'get', path: FW.RECEIVED },
        { method: 'get', path: FW.FRIENDS_REQUESTS_RECEIVED },
      ]);
    }
  },

  async getSentRequests(): Promise<FriendRequest[]> {
    try {
      const pending = await getPendingRequestersFromJava();
      return pending
        .filter((item) => item.requester === true)
        .map((item, index) => mapPendingRequesterToRequest(item, index, 'sent'));
    } catch {
      return requestFromCandidates<FriendRequest[]>([
        { method: 'get', path: FW.REQUESTS_SENT },
        { method: 'get', path: FW.SENT },
        { method: 'get', path: FW.FRIENDS_REQUESTS_SENT },
      ]);
    }
  },

  async getFriends(): Promise<FriendUser[]> {
    try {
      const contacts = await requestFromCandidates<ContactPayload[]>([
        { method: 'get', path: FW.CONTACTS },
      ]);
      return contacts.map(mapContactToFriend);
    } catch {
      return requestFromCandidates<FriendUser[]>([
        { method: 'get', path: FW.FRIENDS_LIST },
        { method: 'get', path: FW.FRIENDS_ROOT },
      ]);
    }
  },

  async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    const payload = await requestFromCandidates<JavaFriendshipPayload | Friendship>([
      {
        method: 'post',
        path: FW.REQUEST,
        data: { addresseeId, userId: addresseeId },
      },
      {
        method: 'post',
        path: FW.FRIENDS_REQUEST,
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
      { method: 'post', path: FW.ACCEPT, data: { requestId, userId: requestId } },
      { method: 'post', path: FW.ACCEPT_BY_REQUEST_ID(requestId) },
      { method: 'post', path: FW.ACCEPT_BY_ID(requestId) },
    ]);
  },

  async deleteFriendRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.REJECT, data: { requestId, userId: requestId } },
      { method: 'delete', path: FW.REQUEST_BY_ID(requestId) },
      { method: 'delete', path: FW.BY_ID(requestId) },
    ]);
  },

  async cancelSentRequest(requestId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.REJECT, data: { requestId, userId: requestId } },
      { method: 'delete', path: FW.CANCEL_REQUEST(requestId) },
      { method: 'delete', path: FW.REQUEST_BY_ID(requestId) },
      { method: 'post', path: FW.CANCEL, data: { requestId } },
    ]);
  },

  async unfriend(friendId: string): Promise<void> {
    await requestFromCandidates<unknown>([
      { method: 'post', path: FW.UNFRIEND, data: { friendId, userId: friendId } },
      { method: 'delete', path: FW.FRIENDS_BY_ID(friendId) },
      { method: 'delete', path: FW.FRIEND_BY_ID(friendId) },
    ]);
  },
};

