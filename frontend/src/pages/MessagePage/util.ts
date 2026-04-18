import type { ChatMessage, ConversationSummary } from '@/interface/message';
import type { User } from '@/interface/user';

const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;

export const toComparableTimestamp = (value?: string | null): number => {
  if (!value || value.trim().length === 0) {
    return 0;
  }

  const normalized = HAS_TIMEZONE_SUFFIX.test(value) ? value : `${value}Z`;
  const timestamp = new Date(normalized).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const sortConversationsByNewest = (items: ConversationSummary[]): ConversationSummary[] => {
  return [...items].sort((first, second) => {
    const secondTime = toComparableTimestamp(second.lastMessageAt);
    const firstTime = toComparableTimestamp(first.lastMessageAt);
    return secondTime - firstTime;
  });
};

export const sortMessagesByOldest = (items: ChatMessage[]): ChatMessage[] => {
  return [...items].sort((first, second) => {
    const firstTime = toComparableTimestamp(first.createdAt);
    const secondTime = toComparableTimestamp(second.createdAt);
    return firstTime - secondTime;
  });
};

export const normalizeText = (value: string): string => value.trim().toLowerCase();

export const buildFallbackAvatar = (seed: string): string =>
  `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;

export const dedupeUsersById = (users: User[]): User[] => {
  const uniqueUsers = new Map<string, User>();

  users.forEach((user) => {
    uniqueUsers.set(user.id, user);
  });

  return Array.from(uniqueUsers.values());
};
