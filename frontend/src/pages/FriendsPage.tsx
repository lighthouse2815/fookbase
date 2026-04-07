import clsx from 'clsx';
import {
  AlertTriangle,
  Filter,
  House,
  Menu,
  RefreshCcw,
  Search,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import { FriendRequestCard } from '../components/friends/FriendRequestCard';
import { FriendsPageSkeleton } from '../components/friends/FriendsPageSkeleton';
import { ProfilePreview } from '../components/friends/ProfilePreview';
import { SidebarItem } from '../components/friends/SidebarItem';
import { UserCard } from '../components/friends/UserCard';
import {
  friendsMock,
  receivedFriendRequestsMock,
  sentFriendRequestsMock,
} from '../data/mockData';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { friendshipService } from '../services/friendshipService';
import type { FriendRequest, FriendSuggestion, FriendUser } from '../types/friendship';

type FriendsTab = 'home' | 'requests' | 'suggestions' | 'friends';
type FriendFilter = 'all' | 'online' | 'sameFaculty';
type FetchState = 'loading' | 'success' | 'error';
type ProfileRelation = 'received' | 'sent' | 'suggestion' | 'friend' | null;

const parseFriendsTab = (value: string | null): FriendsTab => {
  if (value === 'requests' || value === 'suggestions' || value === 'friends') {
    return value;
  }

  return 'home';
};

const toSuggestion = (user: FriendUser | FriendRequest): FriendSuggestion => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  avatarUrl: user.avatarUrl,
  mutualFriends: user.mutualFriends,
  faculty: user.faculty,
  isOnline: user.isOnline,
});

const toFriendUser = (request: FriendRequest): FriendUser => ({
  id: request.id,
  username: request.username,
  fullName: request.fullName,
  avatarUrl: request.avatarUrl,
  mutualFriends: request.mutualFriends,
  faculty: request.faculty,
  friendshipId: request.requestId,
  since: new Date().toISOString(),
});

const toSentRequest = (user: FriendSuggestion, requesterId: string): FriendRequest => ({
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

const sanitizeSuggestions = (value: unknown, fallback: FriendSuggestion[]) => {
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
      avatarUrl: typed.avatarUrl ?? `https://i.pravatar.cc/150?u=${safeId}`,
      mutualFriends: typeof typed.mutualFriends === 'number' ? typed.mutualFriends : 0,
      faculty: typed.faculty,
      isOnline: typed.isOnline,
    } satisfies FriendSuggestion;
  });
};

const sanitizeRequests = (
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
      avatarUrl: typed.avatarUrl ?? `https://i.pravatar.cc/150?u=${safeId}`,
      mutualFriends: typeof typed.mutualFriends === 'number' ? typed.mutualFriends : 0,
      requestedAt: typed.requestedAt,
      faculty: typed.faculty,
      isOnline: typed.isOnline,
    } satisfies FriendRequest;
  });
};

const sanitizeFriends = (value: unknown, fallback: FriendUser[]) => {
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
      avatarUrl: typed.avatarUrl ?? `https://i.pravatar.cc/150?u=${safeId}`,
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

export const FriendsPage = () => {
  const { t } = useTranslation();
  const { suggestions: sidebarSuggestions, currentUser } = useOutletContext<MainLayoutOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<FriendsTab>(() => parseFriendsTab(searchParams.get('tab')));
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
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

  const loadFriendData = useCallback(async () => {
    setFetchState('loading');
    setErrorMessage(null);

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
      sanitizeRequests(
        receivedResult.status === 'fulfilled' ? receivedResult.value : undefined,
        receivedFriendRequestsMock,
        currentUser.id,
        'received',
      ),
    );

    setSentRequests(
      sanitizeRequests(
        sentResult.status === 'fulfilled' ? sentResult.value : undefined,
        sentFriendRequestsMock,
        currentUser.id,
        'sent',
      ),
    );

    const resolvedSuggestions = suggestionsResult.status === 'fulfilled'
      ? suggestionsResult.value
      : sidebarSuggestions;
    setSuggestions(sanitizeSuggestions(resolvedSuggestions, []));

    setFriends(sanitizeFriends(friendsResult.status === 'fulfilled' ? friendsResult.value : undefined, friendsMock));

    if (hadCriticalError) {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.realtimeFallback'));
      return;
    }

    setFetchState('success');
  }, [currentUser.id, sidebarSuggestions, t]);

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

  useEffect(() => {
    if (selectedUserId) {
      const exists =
        receivedRequests.some((user) => user.id === selectedUserId) ||
        sentRequests.some((user) => user.id === selectedUserId) ||
        suggestions.some((user) => user.id === selectedUserId) ||
        friends.some((user) => user.id === selectedUserId);

      if (!exists) {
        setSelectedUserId(null);
      }
      return;
    }

    const defaultUser = receivedRequests[0] ?? sentRequests[0] ?? suggestions[0] ?? friends[0] ?? null;

    if (defaultUser) {
      setSelectedUserId(defaultUser.id);
    }
  }, [friends, receivedRequests, selectedUserId, sentRequests, suggestions]);

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
      void loadFriendData();
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.acceptNotSynced'));
    }
  };

  const handleDeleteReceivedRequest = async (requestId: string) => {
    setReceivedRequests((existing) => existing.filter((item) => item.requestId !== requestId));

    try {
      await friendshipService.deleteFriendRequest(requestId);
      void loadFriendData();
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.deleteNotSynced'));
    }
  };

  const handleCancelSentRequest = async (requestId: string) => {
    const sentRequest = sentRequests.find((item) => item.requestId === requestId);

    setSentRequests((existing) => existing.filter((item) => item.requestId !== requestId));

    if (sentRequest) {
      setSuggestions((existing) => {
        if (existing.some((item) => item.id === sentRequest.id)) {
          return existing;
        }

        return [toSuggestion(sentRequest), ...existing];
      });
    }

    try {
      await friendshipService.cancelSentRequest(requestId);
      void loadFriendData();
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
      void loadFriendData();
    } catch {
      setFetchState('error');
      setErrorMessage(t('friendsPage.errors.sendNotSynced'));
    }
  };

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
      void loadFriendData();
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

  if (fetchState === 'loading') {
    return <FriendsPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('friendsPage.managementTitle')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tabTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadFriendData()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <RefreshCcw size={15} />
              {t('friendsPage.refresh')}
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300 xl:hidden"
              aria-label={t('friendsPage.openMenuAria')}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-amber-300/50 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
            {errorMessage}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        {isSidebarOpen ? (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-950/50 xl:hidden"
            aria-label={t('friendsPage.closeMenuAria')}
          />
        ) : null}

        <aside
          className={clsx(
            'z-30 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/85',
            'xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:translate-x-0',
            'fixed left-3 top-20 h-[calc(100vh-6rem)] w-[260px] xl:static xl:w-auto',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] xl:translate-x-0',
          )}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.menuTitle')}</h2>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="space-y-2">
            {sidebarTabs.map((tab) => {
              const count =
                tab.id === 'requests'
                  ? receivedRequests.length
                  : tab.id === 'suggestions'
                    ? suggestions.length
                    : tab.id === 'friends'
                      ? friends.length
                      : undefined;

              return (
                <SidebarItem
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  active={activeTab === tab.id}
                  count={count}
                  onClick={() => {
                    handleChangeTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                />
              );
            })}
          </nav>
        </aside>

        <main className="space-y-4">
          {activeTab === 'home' ? (
            <>
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.receivedRequestsTitle')}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('friendsPage.receivedRequestCount', { count: receivedRequests.length })}
                  </span>
                </div>

                {receivedRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.receivedRequests')}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {receivedRequests.map((request) => (
                      <FriendRequestCard
                        key={request.requestId}
                        request={request}
                        mode="received"
                        selected={selectedUserId === request.id}
                        onSelect={() => setSelectedUserId(request.id)}
                        onConfirm={() => void handleConfirmRequest(request.requestId)}
                        onDelete={() => void handleDeleteReceivedRequest(request.requestId)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.sentRequestsTitle')}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('friendsPage.sentRequestCount', { count: sentRequests.length })}
                  </span>
                </div>

                {sentRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.sentRequestsRecent')}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sentRequests.map((request) => (
                      <FriendRequestCard
                        key={request.requestId}
                        request={request}
                        mode="sent"
                        selected={selectedUserId === request.id}
                        onSelect={() => setSelectedUserId(request.id)}
                        onCancel={() => void handleCancelSentRequest(request.requestId)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.suggestionTitle')}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('friendsPage.suggestionCount', { count: suggestions.length })}
                  </span>
                </div>

                {suggestions.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.suggestionsTemporary')}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {suggestions.map((suggestion) => (
                      <UserCard
                        key={suggestion.id}
                        user={suggestion}
                        variant="grid"
                        selected={selectedUserId === suggestion.id}
                        onSelect={() => setSelectedUserId(suggestion.id)}
                        primaryActionLabel={t('friendsPage.actions.addFriend')}
                        onPrimaryAction={() => void handleAddFriend(suggestion.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}

          {activeTab === 'requests' ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.requestsTitle')}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('friendsPage.itemsCount', { count: receivedRequests.length + sentRequests.length })}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.receivedRequestsTitle')}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('friendsPage.receivedRequestCount', { count: receivedRequests.length })}
                    </span>
                  </div>

                  {receivedRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('friendsPage.empty.receivedRequestsPending')}
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {receivedRequests.map((request) => (
                        <FriendRequestCard
                          key={request.requestId}
                          request={request}
                          mode="received"
                          selected={selectedUserId === request.id}
                          onSelect={() => setSelectedUserId(request.id)}
                          onConfirm={() => void handleConfirmRequest(request.requestId)}
                          onDelete={() => void handleDeleteReceivedRequest(request.requestId)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.sentRequestsTitle')}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('friendsPage.sentRequestCount', { count: sentRequests.length })}
                    </span>
                  </div>

                  {sentRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.sentRequests')}</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {sentRequests.map((request) => (
                        <FriendRequestCard
                          key={request.requestId}
                          request={request}
                          mode="sent"
                          selected={selectedUserId === request.id}
                          onSelect={() => setSelectedUserId(request.id)}
                          onCancel={() => void handleCancelSentRequest(request.requestId)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'suggestions' ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.suggestionTitle')}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('friendsPage.peopleCount', { count: suggestions.length })}</span>
              </div>

              {suggestions.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.suggestions')}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((suggestion) => (
                    <UserCard
                      key={suggestion.id}
                      user={suggestion}
                      variant="grid"
                      selected={selectedUserId === suggestion.id}
                      onSelect={() => setSelectedUserId(suggestion.id)}
                      primaryActionLabel={t('friendsPage.actions.addFriend')}
                      onPrimaryAction={() => void handleAddFriend(suggestion.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'friends' ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.friendsTitle')}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t('friendsPage.resultCount', { count: filteredFriends.length })}</span>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={friendSearch}
                    onChange={(event) => setFriendSearch(event.target.value)}
                    placeholder={t('friendsPage.searchPlaceholder')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>

                <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                  <Filter size={14} className="ml-2 shrink-0 text-slate-400" />
                  {friendFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setFriendFilter(filter.id)}
                      className={clsx(
                        'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                        friendFilter === filter.id
                          ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFriends.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.friendsFiltered')}</p>
              ) : (
                <div className="space-y-3">
                  {filteredFriends.map((friend) => (
                    <UserCard
                      key={friend.id}
                      user={friend}
                      variant="list"
                      selected={selectedUserId === friend.id}
                      onSelect={() => setSelectedUserId(friend.id)}
                      statusText={friend.isOnline ? t('friendsPage.status.online') : t('friendsPage.status.friend')}
                      primaryActionLabel={t('friendsPage.actions.message')}
                      secondaryActionLabel={t('friendsPage.actions.unfriend')}
                      onSecondaryAction={() => requestUnfriend(friend.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </main>

        <div className="xl:sticky xl:top-20 xl:h-fit">
          <ProfilePreview
            user={selectedProfile?.user ?? null}
            relation={(selectedProfile?.relation ?? null) as ProfileRelation}
            onAddFriend={
              selectedSuggestion
                ? () => {
                    void handleAddFriend(selectedSuggestion.id);
                  }
                : undefined
            }
            onConfirmRequest={
              selectedReceivedRequest
                ? () => {
                    void handleConfirmRequest(selectedReceivedRequest.requestId);
                  }
                : undefined
            }
            onDeleteRequest={
              selectedReceivedRequest
                ? () => {
                    void handleDeleteReceivedRequest(selectedReceivedRequest.requestId);
                  }
                : undefined
            }
            onCancelRequest={
              selectedSentRequest
                ? () => {
                    void handleCancelSentRequest(selectedSentRequest.requestId);
                  }
                : undefined
            }
            onUnfriend={
              selectedFriend
                ? () => {
                    requestUnfriend(selectedFriend.id);
                  }
                : undefined
            }
          />
        </div>
      </div>

      {confirmUnfriendUser ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeUnfriendDialog}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label={t('friendsPage.closeUnfriendDialogAria')}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-400" />

            <div className="space-y-4 p-5 sm:p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('friendsPage.unfriendDialog.title')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t('friendsPage.unfriendDialog.descriptionPrefix')}{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{confirmUnfriendUser.fullName}</span>
                  ? {t('friendsPage.unfriendDialog.descriptionSuffix')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeUnfriendDialog}
                  disabled={isUnfriendSubmitting}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-700"
                >
                  {t('friendsPage.actions.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmUnfriend()}
                  disabled={isUnfriendSubmitting}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUnfriendSubmitting ? t('friendsPage.actions.processing') : t('friendsPage.actions.unfriend')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
