import { House, UserCheck, UserPlus, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';

import {
  friendsMock,
  receivedFriendRequestsMock,
  sentFriendRequestsMock,
} from '@/data/mockData';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import type { FriendRequest, FriendSuggestion, FriendUser } from '@/interface/friendship';
import { friendshipService } from '@/services/friendshipService';

import type { FriendFilter, FriendsPageFetchState, FriendsTab } from '../type';
import {
  parseFriendsTab,
  sanitizeFriends,
  sanitizeRequests,
  sanitizeSuggestions,
  syncPresenceByUserId,
  toFriendUser,
  toSentRequest,
  toSuggestion,
} from '../util';

export const useFriendsPage = () => {
  const { t } = useTranslation();
  const { suggestions: sidebarSuggestions, currentUser, onlineUsers, offlineUsers } =
    useOutletContext<MainLayoutOutletContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<FriendsTab>(() => parseFriendsTab(searchParams.get('tab')));
  const [fetchState, setFetchState] = useState<FriendsPageFetchState>('loading');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);

  const [friendSearch, setFriendSearch] = useState('');
  const [friendFilter, setFriendFilter] = useState<FriendFilter>('all');
  const [confirmUnfriendUser, setConfirmUnfriendUser] = useState<FriendUser | null>(null);
  const [isUnfriendSubmitting, setIsUnfriendSubmitting] = useState(false);
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
  const presenceByUserId = useMemo(() => {
    const mappedPresence = new Map<string, boolean>();

    offlineUsers.forEach((user) => {
      mappedPresence.set(user.id, false);
    });

    onlineUsers.forEach((user) => {
      mappedPresence.set(user.id, true);
    });

    return mappedPresence;
  }, [offlineUsers, onlineUsers]);
  const sidebarSuggestionsRef = useRef(sidebarSuggestions);
  const presenceByUserIdRef = useRef(presenceByUserId);

  useEffect(() => {
    sidebarSuggestionsRef.current = sidebarSuggestions;
  }, [sidebarSuggestions]);

  const loadFriendData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const latestPresenceByUserId = presenceByUserIdRef.current;

    if (!silent) {
      setFetchState('loading');
      setErrorMessage(null);
    }

    const [receivedResult, sentResult, suggestionsResult, friendsResult] = await Promise.allSettled([
      friendshipService.getReceivedRequests(),
      friendshipService.getSentRequests(),
      friendshipService.getFriendSuggestions(),
      friendshipService.getFriends(),
    ]);

    const hadCriticalError =
      receivedResult.status === 'rejected' ||
      sentResult.status === 'rejected' ||
      friendsResult.status === 'rejected';

    setReceivedRequests(
      syncPresenceByUserId(
        sanitizeRequests(
          receivedResult.status === 'fulfilled' ? receivedResult.value : undefined,
          receivedFriendRequestsMock,
          currentUser.id,
          'received',
        ),
        latestPresenceByUserId,
      ),
    );

    setSentRequests(
      syncPresenceByUserId(
        sanitizeRequests(
          sentResult.status === 'fulfilled' ? sentResult.value : undefined,
          sentFriendRequestsMock,
          currentUser.id,
          'sent',
        ),
        latestPresenceByUserId,
      ),
    );

    const resolvedSuggestions = suggestionsResult.status === 'fulfilled'
      ? suggestionsResult.value
      : sidebarSuggestionsRef.current;
    setSuggestions(syncPresenceByUserId(sanitizeSuggestions(resolvedSuggestions, []), latestPresenceByUserId));

    setFriends(
      syncPresenceByUserId(
        sanitizeFriends(friendsResult.status === 'fulfilled' ? friendsResult.value : undefined, friendsMock),
        latestPresenceByUserId,
      ),
    );

    if (hadCriticalError) {
      if (!silent) {
        setFetchState('error');
      }
      setErrorMessage(t('friendsPage.errors.realtimeFallback'));
      return;
    }

    setFetchState('success');
  }, [currentUser.id, t]);

  useEffect(() => {
    presenceByUserIdRef.current = presenceByUserId;
    setReceivedRequests((existing) => syncPresenceByUserId(existing, presenceByUserId));
    setSentRequests((existing) => syncPresenceByUserId(existing, presenceByUserId));
    setSuggestions((existing) => syncPresenceByUserId(existing, presenceByUserId));
    setFriends((existing) => syncPresenceByUserId(existing, presenceByUserId));
  }, [presenceByUserId]);

  useEffect(() => {
    void loadFriendData();
  }, [loadFriendData]);

  useEffect(() => {
    const tabFromQuery = parseFriendsTab(searchParams.get('tab'));
    setActiveTab((currentTab) => (currentTab === tabFromQuery ? currentTab : tabFromQuery));
  }, [searchParams]);

  const handleChangeTab = (tab: FriendsTab) => {
    setActiveTab(tab);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', tab);
    setSearchParams(nextSearchParams);
  };

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setSelectedUserId(null);
    setIsPreviewOpen(false);
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    const exists =
      receivedRequests.some((user) => user.id === selectedUserId) ||
      sentRequests.some((user) => user.id === selectedUserId) ||
      suggestions.some((user) => user.id === selectedUserId) ||
      friends.some((user) => user.id === selectedUserId);

    if (!exists) {
      closePreview();
    }
  }, [closePreview, friends, receivedRequests, selectedUserId, sentRequests, suggestions]);

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
        return Boolean(friend.faculty && currentUser.faculty && friend.faculty === currentUser.faculty);
      }

      return true;
    });
  }, [currentUser.faculty, friendFilter, friendSearch, friends]);

  const handleConfirmRequest = async (requestId: string) => {
    const request = receivedRequests.find((item) => item.requestId === requestId);

    if (!request) {
      return;
    }

    setReceivedRequests((existing) => existing.filter((item) => item.requestId !== requestId));
    setFriends((existing) => {
      if (existing.some((item) => item.id === request.id)) {
        return existing;
      }

      return [toFriendUser(request), ...existing];
    });

    try {
      await friendshipService.acceptFriendRequest(requestId);
      void loadFriendData({ silent: true });
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.acceptNotSynced'));
    }
  };

  const handleDeleteReceivedRequest = async (requestId: string) => {
    setReceivedRequests((existing) => existing.filter((item) => item.requestId !== requestId));

    try {
      await friendshipService.deleteFriendRequest(requestId);
      void loadFriendData({ silent: true });
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.deleteNotSynced'));
    }
  };

  const handleCancelSentRequest = async (requestId: string) => {
    setSentRequests((existing) => existing.filter((item) => item.requestId !== requestId));

    try {
      await friendshipService.cancelSentRequest(requestId);
      void loadFriendData({ silent: true });
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.cancelNotSynced'));
    }
  };

  const handleAddFriend = async (userId: string) => {
    const suggestion = suggestions.find((item) => item.id === userId);

    if (!suggestion) {
      return;
    }

    setSuggestions((existing) => existing.filter((item) => item.id !== userId));
    setSentRequests((existing) => [toSentRequest(suggestion, currentUser.id), ...existing]);

    try {
      await friendshipService.sendFriendRequest(userId);
      void loadFriendData({ silent: true });
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.sendNotSynced'));
    }
  };

  const handleMessageUser = useCallback(
    (userId: string) => {
      const nextSearchParams = new URLSearchParams();
      nextSearchParams.set('userId', userId);
      navigate(`/messages?${nextSearchParams.toString()}`);
    },
    [navigate],
  );

  const requestUnfriend = (friendId: string) => {
    const existingFriend = friends.find((friend) => friend.id === friendId);
    if (!existingFriend) {
      return;
    }

    setConfirmUnfriendUser(existingFriend);
  };

  const closeUnfriendDialog = () => {
    if (isUnfriendSubmitting) {
      return;
    }

    setConfirmUnfriendUser(null);
  };

  const handleConfirmUnfriend = async () => {
    if (!confirmUnfriendUser || isUnfriendSubmitting) {
      return;
    }

    const existingFriend = confirmUnfriendUser;
    const friendId = existingFriend.id;

    setIsUnfriendSubmitting(true);
    setConfirmUnfriendUser(null);
    setFriends((existing) => existing.filter((friend) => friend.id !== friendId));

    setSuggestions((existing) => {
      if (existing.some((item) => item.id === friendId)) {
        return existing;
      }

      return [toSuggestion(existingFriend), ...existing];
    });

    try {
      await friendshipService.unfriend(friendId);
      void loadFriendData({ silent: true });
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.unfriendNotSynced'));
    } finally {
      setIsUnfriendSubmitting(false);
    }
  };

  const tabTitle =
    activeTab === 'home'
      ? t('friendsPage.tabs.home')
      : activeTab === 'requests'
        ? t('friendsPage.tabs.requests')
        : activeTab === 'suggestions'
          ? t('friendsPage.tabs.suggestions')
          : t('friendsPage.tabs.friends');

  return {
    t,
    activeTab,
    fetchState,
    isPreviewOpen,
    selectedUserId,
    isSidebarOpen,
    setIsSidebarOpen,
    errorMessage,
    receivedRequests,
    sentRequests,
    suggestions,
    friends,
    friendSearch,
    setFriendSearch,
    friendFilter,
    setFriendFilter,
    confirmUnfriendUser,
    isUnfriendSubmitting,
    sidebarTabs,
    friendFilters,
    loadFriendData,
    handleChangeTab,
    handleSelectUser,
    closePreview,
    selectedProfile,
    filteredFriends,
    handleConfirmRequest,
    handleDeleteReceivedRequest,
    handleCancelSentRequest,
    handleAddFriend,
    handleMessageUser,
    requestUnfriend,
    closeUnfriendDialog,
    handleConfirmUnfriend,
    tabTitle,
    selectedSuggestion,
    selectedReceivedRequest,
    selectedSentRequest,
    selectedFriend,
  };
};
