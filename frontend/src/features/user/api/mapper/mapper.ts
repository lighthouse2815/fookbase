import type {
  CurrentUserResponseDto,
  UserProfilePresenceResponseDto,
  UserResponseDto,
} from '@/features/user/api/dtos/response.dto';
import type { User } from '@/features/user/types/contracts';

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg';

const firstNonEmptyTrimmed = (...values: Array<string | undefined | null>): string | undefined => {
  for (const value of values) {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
};

const resolveDisplayName = (...values: Array<string | undefined | null>): string => {
  return firstNonEmptyTrimmed(...values) ?? 'user';
};

const buildFallbackUsername = (userId: string): string => {
  const normalized = userId.replace(/-/g, '').trim();
  if (!normalized) {
    return 'user';
  }

  return `user_${normalized.slice(0, 8)}`;
};

export const mapCurrentUserResponseDtoToUser = (payload: CurrentUserResponseDto): User => {
  const id = payload.userId;
  const displayName = resolveDisplayName(payload.displayName);

  return {
    id,
    username: firstNonEmptyTrimmed(displayName) ?? buildFallbackUsername(id),
    fullName: displayName,
    avatarUrl: firstNonEmptyTrimmed(payload.avatarUrl) ?? DEFAULT_AVATAR_URL,
  };
};

export const mapUserResponseDtoToUser = (payload: UserResponseDto): User => {
  const displayName = resolveDisplayName(payload.displayName, payload.fullName, payload.username);

  return {
    id: payload.id,
    username: firstNonEmptyTrimmed(payload.username, displayName) ?? 'user',
    fullName: displayName,
    email: payload.email?.trim() || undefined,
    avatarUrl: firstNonEmptyTrimmed(payload.avatarUrl) ?? DEFAULT_AVATAR_URL,
    isOnline: payload.isOnline,
    lastSeenAt: payload.lastSeenAt,
    faculty: payload.faculty,
  };
};

export const mapPresenceToUser = (payload: UserProfilePresenceResponseDto): User => {
  const id = payload.userId;
  const displayName = resolveDisplayName(payload.displayName);

  return {
    id,
    username: displayName,
    fullName: displayName,
    avatarUrl: firstNonEmptyTrimmed(payload.avatarUrl) ?? DEFAULT_AVATAR_URL,
    isOnline: payload.isOnline,
    lastSeenAt: payload.lastSeenAt ?? undefined,
  };
};
