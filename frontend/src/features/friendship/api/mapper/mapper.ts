import { parseApiDate } from '@/shared/lib/date';
import type {
  BlockedUser,
  FriendRequest,
  Friendship,
  FriendshipStatus,
  FriendUser,
} from '@/features/friendship/types/contracts';
import type {
  BlockedUserResponseDto,
  ContactResponseDto,
  JavaFriendshipResponseDto,
  PendingRequesterResponseDto,
} from '@/features/friendship/api/dtos/response.dto';

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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

  return DEFAULT_AVATAR_URL;
};

const normalizeFriendshipStatus = (value: unknown): FriendshipStatus => {
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
  payload: Partial<FriendRequest> | PendingRequesterResponseDto,
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

const resolveFriendRequestComparableTimestamp = (
  request: Partial<FriendRequest> | PendingRequesterResponseDto,
): number => {
  const timestamp = resolveFriendRequestTimestamp(request);
  if (!timestamp) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsedTimestamp = parseApiDate(timestamp).getTime();
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : Number.NEGATIVE_INFINITY;
};

export const sortFriendRequestsByLatestUpdate = (requests: FriendRequest[]): FriendRequest[] =>
  [...requests].sort(
    (first, second) => resolveFriendRequestComparableTimestamp(second) - resolveFriendRequestComparableTimestamp(first),
  );

export const mapPendingRequesterResponseDtoToFriendRequest = (
  payload: PendingRequesterResponseDto,
  index: number,
  mode: 'received' | 'sent',
): FriendRequest => {
  const userId = toSafeId(payload.userId ?? payload.id, `friend-request-${index}`);
  const fullName = toDisplayName(payload.displayName ?? payload.fullName ?? payload.username, `User ${index + 1}`);
  const requestedAt = resolveFriendRequestTimestamp(payload);
  const updatedAt = firstNonEmptyString(payload.updatedAt, payload.updateAt);
  const createdAt = firstNonEmptyString(payload.createdAt, payload.createAt);

  return {
    id: userId,
    requestId: userId,
    requesterId: mode === 'sent' ? 'me' : userId,
    addresseeId: mode === 'sent' ? userId : 'me',
    username: toDisplayName(payload.username ?? payload.displayName, `user_${userId}`),
    fullName,
    avatarUrl: toAvatarUrl(payload.avatarUrl),
    mutualFriends: 0,
    requestedAt,
    updatedAt,
    createdAt,
  };
};

export const mapContactResponseDtoToFriendUser = (payload: ContactResponseDto, index: number): FriendUser => {
  const userId = toSafeId(payload.userId ?? payload.id, `friend-${index}`);
  const displayName = toDisplayName(
    payload.displayName ?? payload.nickName ?? payload.fullName ?? payload.username ?? payload.phoneNumber,
    `Friend ${index + 1}`,
  );

  return {
    id: userId,
    friendshipId: typeof payload.contactId === 'string' ? payload.contactId : undefined,
    username: toDisplayName(
      payload.username ?? payload.displayName ?? payload.nickName ?? payload.phoneNumber,
      `friend_${userId}`,
    ),
    fullName: displayName,
    avatarUrl: toAvatarUrl(payload.avatarUrl),
    mutualFriends: typeof payload.mutualFriends === 'number' ? payload.mutualFriends : 0,
    friendsCount: typeof payload.friendsCount === 'number' ? payload.friendsCount : undefined,
  };
};

export const mapJavaFriendshipResponseDtoToFriendship = (
  payload: JavaFriendshipResponseDto,
  addresseeId: string,
): Friendship => {
  const requesterId = toSafeId(payload.requesterId ?? payload.userId, 'me');

  return {
    id: toSafeId(payload.friendshipId ?? payload.id, `friendship-${addresseeId}-${Date.now()}`),
    requesterId,
    addresseeId: toSafeId(payload.addresseeId, addresseeId),
    status: normalizeFriendshipStatus(payload.status),
  };
};

const isFriendship = (value: unknown): value is Friendship =>
  isRecord(value) &&
  typeof value.requesterId === 'string' &&
  typeof value.addresseeId === 'string' &&
  typeof value.status === 'string';

const isJavaFriendshipResponseDto = (value: unknown): value is JavaFriendshipResponseDto =>
  isRecord(value) &&
  (typeof value.friendshipId === 'string' ||
    typeof value.id === 'string' ||
    typeof value.requesterId === 'string' ||
    typeof value.userId === 'string' ||
    typeof value.addresseeId === 'string' ||
    typeof value.status === 'string');

export const mapSendFriendRequestResponseToFriendship = (payload: unknown, addresseeId: string): Friendship => {
  if (isFriendship(payload)) {
    return {
      id: toSafeId(payload.id, `friendship-${addresseeId}-${Date.now()}`),
      requesterId: toSafeId(payload.requesterId, 'me'),
      addresseeId: toSafeId(payload.addresseeId, addresseeId),
      status: normalizeFriendshipStatus(payload.status),
    };
  }

  if (isJavaFriendshipResponseDto(payload)) {
    return mapJavaFriendshipResponseDtoToFriendship(payload, addresseeId);
  }

  return {
    id: `friendship-${addresseeId}-${Date.now()}`,
    requesterId: 'me',
    addresseeId,
    status: 'pending',
  };
};

export const mapBlockedUserResponseDtoToBlockedUser = (
  payload: BlockedUserResponseDto,
  index: number,
): BlockedUser => {
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
