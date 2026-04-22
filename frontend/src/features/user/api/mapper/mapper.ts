import type { UserProfilePresenceResponseDto } from '@/features/user/api/dtos/response.dto';
import type { User } from '@/features/user/types/contracts';

export const mapPresenceToUser = (payload: UserProfilePresenceResponseDto): User => {
  const id = payload.userId;
  const displayName = payload.displayName?.trim() || 'user';

  return {
    id,
    username: displayName,
    fullName: displayName,
    avatarUrl: payload.avatarUrl?.trim() || 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
    isOnline: payload.isOnline,
    lastSeenAt: payload.lastSeenAt ?? undefined,
  };
};
