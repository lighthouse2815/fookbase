import { Bookmark, Gamepad2, House, MessageSquareText, UsersRound } from 'lucide-react';

import type { NotificationItem } from '@/features/notification/types/contracts';

export const NAV_ITEMS = [
  { key: 'home', icon: House, path: '/' },
  { key: 'friends', icon: UsersRound, path: '/friends' },
  { key: 'messages', icon: MessageSquareText, path: '/messages' },
  { key: 'games', icon: Gamepad2, path: '/games' },
  { key: 'saved', icon: Bookmark, path: '/saved' },
] as const;

export function countUnreadNotifications(items: NotificationItem[]): number {
  return items.filter((item) => !item.isRead).length;
}

export function parsePhoneNumberFromSearch(search: string): string {
  return new URLSearchParams(search).get('phoneNumber') ?? '';
}

export function buildFriendsSearchPath(phoneNumber: string): string {
  return `/friends/search?phoneNumber=${encodeURIComponent(phoneNumber)}`;
}
