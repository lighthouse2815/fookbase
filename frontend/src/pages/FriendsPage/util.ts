import type { FriendRequest, FriendSuggestion, FriendUser } from '@/interface/friendship';

import type { FriendSearchStatusMeta } from './interface';
import type { FriendsTab, PresenceAwareUser } from './type';

export const parseFriendsTab = (value: string | null): FriendsTab => {
  if (value === 'requests' || value === 'suggestions' || value === 'friends') {
    return value;
  }

  return 'home';
};

export const toSuggestion = (user: FriendUser | FriendRequest): FriendSuggestion => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  mutualFriends: user.mutualFriends,
  faculty: user.faculty,
  isOnline: user.isOnline,
});

export const toFriendUser = (request: FriendRequest): FriendUser => ({
  id: request.id,
  username: request.username,
  fullName: request.fullName,
  avatarUrl: request.avatarUrl,
  mutualFriends: request.mutualFriends,
  faculty: request.faculty,
  friendshipId: request.requestId,
  since: new Date().toISOString(),
});

export const toSentRequest = (user: FriendSuggestion, requesterId: string): FriendRequest => ({
  id: user.id,
  requestId: `local-sent-${user.id}-${Date.now()}`,
  requesterId,
  addresseeId: user.id,
  username: user.username,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  mutualFriends: user.mutualFriends,
  requestedAt: new Date().toISOString(),
  faculty: user.faculty,
  isOnline: user.isOnline,
});

export const sanitizeSuggestions = (value: unknown, fallback: FriendSuggestion[]) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((item, index) => {
    const typed = item as Partial<FriendSuggestion>;
    const safeId = typed.id ?? `suggestion-${index}`;

    return {
      id: safeId,
      username: typed.username ?? `user_${safeId}`,
      fullName: typed.fullName ?? 'User',
      avatarUrl: typed.avatarUrl ?? 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
      mutualFriends: typeof typed.mutualFriends === 'number' ? typed.mutualFriends : 0,
      faculty: typed.faculty,
      isOnline: typed.isOnline,
    } satisfies FriendSuggestion;
  });
};

export const sanitizeRequests = (
  value: unknown,
  fallback: FriendRequest[],
  currentUserId: string,
  mode: 'received' | 'sent',
) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((item, index) => {
    const typed = item as Partial<FriendRequest>;
    const safeId = typed.id ?? `request-user-${index}`;
    const requesterId = mode === 'received' ? typed.requesterId ?? safeId : typed.requesterId ?? currentUserId;
    const addresseeId = mode === 'received' ? typed.addresseeId ?? currentUserId : typed.addresseeId ?? safeId;

    return {
      id: safeId,
      requestId: typed.requestId ?? `request-${safeId}-${index}`,
      requesterId,
      addresseeId,
      username: typed.username ?? `user_${safeId}`,
      fullName: typed.fullName ?? 'User',
      avatarUrl: typed.avatarUrl ?? 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
      mutualFriends: typeof typed.mutualFriends === 'number' ? typed.mutualFriends : 0,
      requestedAt: typed.requestedAt,
      faculty: typed.faculty,
      isOnline: typed.isOnline,
    } satisfies FriendRequest;
  });
};

export const sanitizeFriends = (value: unknown, fallback: FriendUser[]) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((item, index) => {
    const typed = item as Partial<FriendUser>;
    const safeId = typed.id ?? `friend-${index}`;

    return {
      id: safeId,
      friendshipId: typed.friendshipId,
      username: typed.username ?? `friend_${safeId}`,
      fullName: typed.fullName ?? 'User',
      avatarUrl: typed.avatarUrl ?? 'https://res.cloudinary.com/drfhezlyn/image/upload/v1776615564/default_avatar_art0sv.jpg',
      mutualFriends: typeof typed.mutualFriends === 'number' ? typed.mutualFriends : 0,
      friendsCount: typed.friendsCount,
      bio: typed.bio,
      coverUrl: typed.coverUrl,
      since: typed.since,
      faculty: typed.faculty,
      isOnline: typed.isOnline,
    } satisfies FriendUser;
  });
};

export const syncPresenceByUserId = <T extends PresenceAwareUser>(
  users: T[],
  presenceByUserId: Map<string, boolean>,
): T[] => {
  let hasChange = false;

  const syncedUsers = users.map((user) => {
    const onlineState = presenceByUserId.get(user.id);
    if (typeof onlineState !== 'boolean' || onlineState === user.isOnline) {
      return user;
    }

    hasChange = true;
    return {
      ...user,
      isOnline: onlineState,
    };
  });

  return hasChange ? syncedUsers : users;
};

export const normalizeFriendSearchStatus = (status?: string | null): string => status?.trim().toUpperCase() ?? 'NONE';

export const getFriendSearchStatusMeta = (status: string, isSelf: boolean): FriendSearchStatusMeta => {
  if (isSelf) {
    return {
      label: 'Tai khoan cua ban',
      action: 'none',
      buttonLabel: 'Khong the ket ban',
      buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      badgeClassName:
        'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200',
    };
  }

  switch (status) {
    case 'PENDING':
      return {
        label: 'Da gui loi moi',
        action: 'cancel',
        buttonLabel: 'Huy loi moi',
        buttonClassName: 'bg-slate-600 text-white hover:bg-slate-700',
        badgeClassName:
          'border border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200',
      };
    case 'INVITED':
      return {
        label: 'Da nhan loi moi tu nguoi nay',
        action: 'respond',
        buttonLabel: 'Chap nhan',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-sky-300/60 bg-sky-100 text-sky-800 dark:border-sky-500/50 dark:bg-sky-500/15 dark:text-sky-200',
      };
    case 'ACCEPTED':
      return {
        label: 'Da la ban be',
        action: 'none',
        buttonLabel: 'Da ket ban',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200',
      };
    case 'REJECTED':
    case 'REMOVED':
    case 'NONE':
      return {
        label: 'Chua ket ban',
        action: 'send',
        buttonLabel: 'Gui ket ban',
        buttonClassName: 'bg-brand-600 text-white hover:bg-brand-700',
        badgeClassName:
          'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200',
      };
    case 'BLOCKED':
      return {
        label: 'Khong the ket ban luc nay',
        action: 'none',
        buttonLabel: 'Khong kha dung',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-rose-300/60 bg-rose-100 text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-200',
      };
    default:
      return {
        label: `Trang thai: ${status}`,
        action: 'none',
        buttonLabel: 'Khong kha dung',
        buttonClassName: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
        badgeClassName:
          'border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200',
      };
  }
};
