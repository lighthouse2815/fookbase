import axios from 'axios';

import { API_CONFIG } from '@/config/apiConfig';
import { apiClient, javaApiClient } from '@/services/apiClient';
import type { ApiEnvelope } from '@/interface/api';
import type {
  FriendRequest,
  Friendship,
  FriendshipStatus,
  FriendUser,
  RequestCandidate,
  PendingRequesterPayload,
  ContactPayload,
  JavaFriendshipPayload,
  BlockedUser,
  BlockedUserPayload,
} from '@/interface/friendship';

const FW = API_CONFIG.ENDPOINTS.FRIENDSHIPS;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractFriendshipEnvelopeData = <T>(payload: T | ApiEnvelope<T>): T => {
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

const toAvatarUrl = (value: unknown): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';
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

const firstNonEmptyString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
};

export const resolveFriendRequestTimestamp = (
  payload: Partial<FriendRequest> | PendingRequesterPayload,
): string | undefined =>
  firstNonEmptyString(payload.updatedAt, payload.updateAt, payload.createdAt, payload.createAt, payload.requestedAt);

export const normalizeFriendRequestTimestamps = (request: FriendRequest): FriendRequest => {
  const requestedAt = resolveFriendRequestTimestamp(request);
  const updatedAt = firstNonEmptyString(request.updatedAt, request.updateAt);
  const createdAt = firstNonEmptyString(request.createdAt, request.createAt);

  return {
    ...request,
    requestedAt,
    updatedAt,
    createdAt,
  };
};

export const requestFromCandidates = async <T>(candidates: RequestCandidate[]): Promise<T> => {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      const client = candidate.client === 'java' ? javaApiClient : apiClient;
      const response = await client.request<T | ApiEnvelope<T>>({
        method: candidate.method,
        url: candidate.path,
        data: candidate.data,
      });
      return extractFriendshipEnvelopeData<T>(response.data);
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

export const getPendingRequestersFromJava = async (): Promise<PendingRequesterPayload[]> => {
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

export const mapPendingRequesterToRequest = (
  payload: PendingRequesterPayload,
  index: number,
  mode: 'received' | 'sent',
): FriendRequest => {
  const userId = toSafeId(payload.userId ?? payload.id, `friend-request-${index}`);
  const fullName = toDisplayName(
    payload.displayName ?? payload.fullName ?? payload.username,
    `User ${index + 1}`,
  );

  const requestedAt = resolveFriendRequestTimestamp(payload);
  const updatedAt = firstNonEmptyString(payload.updatedAt, payload.updateAt);
  const createdAt = firstNonEmptyString(payload.createdAt, payload.createAt);

  return {
    id: userId,
    requestId: userId,
    requesterId: mode === 'sent' ? 'me' : userId,
    addresseeId: mode === 'sent' ? userId : 'me',
    username: toDisplayName(payload.username, `user_${userId}`),
    fullName,
    avatarUrl: toAvatarUrl(payload.avatarUrl),
    mutualFriends: 0,
    requestedAt,
    updatedAt,
    createdAt,
  };
};

export const mapContactToFriend = (payload: ContactPayload, index: number): FriendUser => {
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
    avatarUrl: toAvatarUrl(payload.avatarUrl),
    mutualFriends: typeof payload.mutualFriends === 'number' ? payload.mutualFriends : 0,
    friendsCount: typeof payload.friendsCount === 'number' ? payload.friendsCount : undefined,
  };
};

export const mapJavaFriendship = (payload: JavaFriendshipPayload, addresseeId: string): Friendship => {
  const requesterId = toSafeId(payload.requesterId ?? payload.userId, 'me');

  return {
    id: toSafeId(payload.friendshipId ?? payload.id, `friendship-${addresseeId}-${Date.now()}`),
    requesterId,
    addresseeId: toSafeId(payload.addresseeId, addresseeId),
    status: normalizeStatus(payload.status),
  };
};

export const isFriendshipPayloadRecord = isRecord;

export const mapBlockedUser = (payload: BlockedUserPayload, index: number): BlockedUser => {
  const userId = toSafeId(payload.userId ?? payload.id, `blocked-user-${index}`);
  const fullName = toDisplayName(payload.displayName ?? payload.fullName ?? payload.username, `User ${index + 1}`);
  const username = toDisplayName(payload.username ?? payload.displayName, `user_${userId}`);

  return {
    id: userId,
    username,
    fullName,
    avatarUrl: toAvatarUrl(payload.avatarUrl),
    blockedAt: typeof payload.blockedAt === 'string' ? payload.blockedAt : undefined,
  };
};
