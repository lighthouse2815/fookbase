import { House, UserCheck, UserPlus, UsersRound } from 'lucide-react';
import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import type { FriendRequest, FriendSuggestion, FriendUser } from '@/features/friendship/types/contracts';
import type { FriendFilter, FriendsTab } from '@/features/friendship/types/pages';

interface UseFriendsDerivedDataParams {
  t: TFunction;
  activeTab: FriendsTab;
  selectedUserId: string | null;
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  suggestions: FriendSuggestion[];
  friends: FriendUser[];
  friendSearch: string;
  friendFilter: FriendFilter;
  currentUserFaculty?: string | null;
}

export const useFriendsDerivedData = ({
  t,
  activeTab,
  selectedUserId,
  receivedRequests,
  sentRequests,
  suggestions,
  friends,
  friendSearch,
  friendFilter,
  currentUserFaculty,
}: UseFriendsDerivedDataParams) => {
  const sidebarTabs: Array<{
    id: FriendsTab;
    label: string;
    icon: typeof House;
  }> = useMemo(
    () => [
      { id: 'home', label: t('friendsPage.sidebar.home'), icon: House },
      { id: 'requests', label: t('friendsPage.sidebar.requests'), icon: UserCheck },
      { id: 'suggestions', label: t('friendsPage.sidebar.suggestions'), icon: UserPlus },
      { id: 'friends', label: t('friendsPage.sidebar.friends'), icon: UsersRound },
    ],
    [t],
  );

  const friendFilters: Array<{ id: FriendFilter; label: string }> = useMemo(
    () => [
      { id: 'all', label: t('friendsPage.filters.all') },
      { id: 'online', label: t('friendsPage.filters.online') },
      { id: 'sameFaculty', label: t('friendsPage.filters.sameFaculty') },
    ],
    [t],
  );

  const selectedReceivedRequest = useMemo(
    () => (selectedUserId ? receivedRequests.find((request) => request.id === selectedUserId) ?? null : null),
    [receivedRequests, selectedUserId],
  );

  const selectedSentRequest = useMemo(
    () => (selectedUserId ? sentRequests.find((request) => request.id === selectedUserId) ?? null : null),
    [selectedUserId, sentRequests],
  );

  const selectedFriend = useMemo(
    () => (selectedUserId ? friends.find((friend) => friend.id === selectedUserId) ?? null : null),
    [friends, selectedUserId],
  );

  const selectedSuggestion = useMemo(
    () => (selectedUserId ? suggestions.find((suggestion) => suggestion.id === selectedUserId) ?? null : null),
    [selectedUserId, suggestions],
  );

  const selectedProfile = useMemo(() => {
    if (selectedFriend) {
      return {
        user: selectedFriend,
        relation: 'friend' as const,
      };
    }

    if (selectedReceivedRequest) {
      return {
        user: selectedReceivedRequest,
        relation: 'received' as const,
      };
    }

    if (selectedSentRequest) {
      return {
        user: selectedSentRequest,
        relation: 'sent' as const,
      };
    }

    if (selectedSuggestion) {
      return {
        user: selectedSuggestion,
        relation: 'suggestion' as const,
      };
    }

    return null;
  }, [selectedFriend, selectedReceivedRequest, selectedSentRequest, selectedSuggestion]);

  const filteredFriends = useMemo(() => {
    const normalizedQuery = friendSearch.trim().toLowerCase();

    return friends.filter((friend) => {
      const fullName = String(friend.fullName ?? '').toLowerCase();
      const username = String(friend.username ?? '').toLowerCase();
      const matchesSearch =
        normalizedQuery.length === 0 || fullName.includes(normalizedQuery) || username.includes(normalizedQuery);

      if (!matchesSearch) {
        return false;
      }

      if (friendFilter === 'online') {
        return friend.isOnline === true;
      }

      if (friendFilter === 'sameFaculty') {
        return Boolean(friend.faculty && currentUserFaculty && friend.faculty === currentUserFaculty);
      }

      return true;
    });
  }, [currentUserFaculty, friendFilter, friendSearch, friends]);

  const tabTitle =
    activeTab === 'home'
      ? t('friendsPage.tabs.home')
      : activeTab === 'requests'
        ? t('friendsPage.tabs.requests')
        : activeTab === 'suggestions'
          ? t('friendsPage.tabs.suggestions')
          : t('friendsPage.tabs.friends');

  return {
    sidebarTabs,
    friendFilters,
    selectedReceivedRequest,
    selectedSentRequest,
    selectedFriend,
    selectedSuggestion,
    selectedProfile,
    filteredFriends,
    tabTitle,
  };
};

export type UseFriendsDerivedDataReturn = ReturnType<typeof useFriendsDerivedData>;
