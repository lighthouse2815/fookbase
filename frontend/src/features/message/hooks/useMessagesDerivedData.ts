import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import type { ConversationSummary } from '@/features/message/types/contracts';
import type { ConversationListItem } from '@/features/message/types/hooks';
import type { ChatFilterTab } from '@/features/message/types/pages';
import type { User } from '@/features/user/types/contracts';
import {
  buildFallbackAvatar,
  dedupeUsersById,
  normalizeText,
} from '@/features/message/utils/page.util';

interface UseMessagesDerivedDataParams {
  t: TFunction;
  currentUserId: string;
  onlineUsers: User[];
  offlineUsers: User[];
  conversations: ConversationSummary[];
  activeTab: ChatFilterTab;
  searchValue: string;
}

export const useMessagesDerivedData = ({
  t,
  currentUserId,
  onlineUsers,
  offlineUsers,
  conversations,
  activeTab,
  searchValue,
}: UseMessagesDerivedDataParams) => {
  const chatTabs: Array<{ id: ChatFilterTab; label: string }> = useMemo(
    () => [
      { id: 'all', label: t('messagesPage.tabs.all') },
      { id: 'friends', label: t('messagesPage.tabs.friends') },
      { id: 'groups', label: t('messagesPage.tabs.groups') },
    ],
    [t],
  );

  const friendCandidates = useMemo(() => {
    return dedupeUsersById([...onlineUsers, ...offlineUsers]).filter((user) => user.id !== currentUserId);
  }, [currentUserId, offlineUsers, onlineUsers]);

  const friendLookupByName = useMemo(() => {
    const lookup = new Map<string, User>();

    friendCandidates.forEach((friend) => {
      const fullNameKey = normalizeText(friend.fullName);
      const usernameKey = normalizeText(friend.username);

      if (fullNameKey && !lookup.has(fullNameKey)) {
        lookup.set(fullNameKey, friend);
      }

      if (usernameKey && !lookup.has(usernameKey)) {
        lookup.set(usernameKey, friend);
      }
    });

    return lookup;
  }, [friendCandidates]);

  const decoratedConversations = useMemo<ConversationListItem[]>(() => {
    const dedupedConversations: ConversationListItem[] = [];
    const seenPrivateKeys = new Set<string>();

    conversations.forEach((conversation) => {
      if (conversation.type === 'GROUP') {
        dedupedConversations.push({
          ...conversation,
          displayAvatar: conversation.avatarUrl?.trim() || buildFallbackAvatar(conversation.conversationId),
          isOnline: false,
        });
        return;
      }

      const matchedFriend = friendLookupByName.get(normalizeText(conversation.name));
      const privateKey = matchedFriend?.id ?? normalizeText(conversation.name);

      if (privateKey && seenPrivateKeys.has(privateKey)) {
        return;
      }

      if (privateKey) {
        seenPrivateKeys.add(privateKey);
      }

      dedupedConversations.push({
        ...conversation,
        displayAvatar:
          matchedFriend?.avatarUrl || conversation.avatarUrl?.trim() || buildFallbackAvatar(conversation.conversationId),
        isOnline: matchedFriend?.isOnline === true,
      });
    });

    return dedupedConversations;
  }, [conversations, friendLookupByName]);

  const privateConversationByUserId = useMemo(() => {
    const mapped = new Map<string, ConversationListItem>();

    decoratedConversations.forEach((conversation) => {
      if (conversation.type !== 'PRIVATE') {
        return;
      }

      const matchedFriend = friendLookupByName.get(normalizeText(conversation.name));
      if (!matchedFriend) {
        return;
      }

      if (!mapped.has(matchedFriend.id)) {
        mapped.set(matchedFriend.id, conversation);
      }
    });

    return mapped;
  }, [decoratedConversations, friendLookupByName]);

  const filteredConversations = useMemo(() => {
    const normalizedQuery = normalizeText(searchValue);

    return decoratedConversations.filter((conversation) => {
      if (activeTab === 'friends' && conversation.type !== 'PRIVATE') {
        return false;
      }

      if (activeTab === 'groups' && conversation.type !== 'GROUP') {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const displayName = normalizeText(conversation.name);
      const preview = normalizeText(conversation.lastMessagePreview ?? '');

      return displayName.includes(normalizedQuery) || preview.includes(normalizedQuery);
    });
  }, [activeTab, decoratedConversations, searchValue]);

  const tabCount = (tab: ChatFilterTab): number => {
    if (tab === 'friends') {
      return decoratedConversations.filter((conversation) => conversation.type === 'PRIVATE').length;
    }

    if (tab === 'groups') {
      return decoratedConversations.filter((conversation) => conversation.type === 'GROUP').length;
    }

    return decoratedConversations.length;
  };

  return {
    chatTabs,
    friendCandidates,
    decoratedConversations,
    privateConversationByUserId,
    filteredConversations,
    tabCount,
  };
};

export type UseMessagesDerivedDataReturn = ReturnType<typeof useMessagesDerivedData>;

