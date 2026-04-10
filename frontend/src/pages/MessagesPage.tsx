import clsx from 'clsx';
import { Plus, Search, Send, UsersRound } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { MainLayoutOutletContext } from '../layouts/MainLayout';
import { messageService } from '../services/messageService';
import type { ChatMessage, ConversationSummary } from '../types/message';
import type { User } from '../types/user';
import { formatRelativeTime } from '../utils/date';

type ChatFilterTab = 'all' | 'friends' | 'groups';
type FetchState = 'loading' | 'success' | 'error';

interface ConversationListItem extends ConversationSummary {
  displayAvatar: string;
  isOnline: boolean;
}

const HAS_TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/i;

const toComparableTimestamp = (value?: string | null): number => {
  if (!value || value.trim().length === 0) {
    return 0;
  }

  const normalized = HAS_TIMEZONE_SUFFIX.test(value) ? value : `${value}Z`;
  const timestamp = new Date(normalized).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortConversationsByNewest = (items: ConversationSummary[]): ConversationSummary[] => {
  return [...items].sort((first, second) => {
    const secondTime = toComparableTimestamp(second.lastMessageAt);
    const firstTime = toComparableTimestamp(first.lastMessageAt);
    return secondTime - firstTime;
  });
};

const sortMessagesByOldest = (items: ChatMessage[]): ChatMessage[] => {
  return [...items].sort((first, second) => {
    const firstTime = toComparableTimestamp(first.createdAt);
    const secondTime = toComparableTimestamp(second.createdAt);
    return firstTime - secondTime;
  });
};

const normalizeText = (value: string): string => value.trim().toLowerCase();

const buildFallbackAvatar = (seed: string): string => `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;

const dedupeUsersById = (users: User[]): User[] => {
  const uniqueUsers = new Map<string, User>();

  users.forEach((user) => {
    uniqueUsers.set(user.id, user);
  });

  return Array.from(uniqueUsers.values());
};

export const MessagesPage = () => {
  const { t } = useTranslation();
  const { currentUser, onlineUsers, offlineUsers } = useOutletContext<MainLayoutOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [activeTab, setActiveTab] = useState<ChatFilterTab>('all');
  const [searchValue, setSearchValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [composerValue, setComposerValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const loadedConversationIdsRef = useRef<Set<string>>(new Set());
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const pendingUserChatCreationRef = useRef<string | null>(null);

  const chatTabs: Array<{ id: ChatFilterTab; label: string }> = useMemo(
    () => [
      { id: 'all', label: t('messagesPage.tabs.all') },
      { id: 'friends', label: t('messagesPage.tabs.friends') },
      { id: 'groups', label: t('messagesPage.tabs.groups') },
    ],
    [t],
  );

  const friendCandidates = useMemo(() => {
    return dedupeUsersById([...onlineUsers, ...offlineUsers]).filter((user) => user.id !== currentUser.id);
  }, [currentUser.id, offlineUsers, onlineUsers]);

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

  const loadConversations = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;

      if (!silent) {
        setFetchState('loading');
      }

      setErrorMessage(null);

      const [allResult, groupResult] = await Promise.allSettled([
        messageService.getConversationsByUser(),
        messageService.getGroupsByUser(),
      ]);

      const mergedById = new Map<string, ConversationSummary>();

      if (allResult.status === 'fulfilled') {
        allResult.value.forEach((conversation) => {
          mergedById.set(conversation.conversationId, conversation);
        });
      }

      if (groupResult.status === 'fulfilled') {
        groupResult.value.forEach((conversation) => {
          mergedById.set(conversation.conversationId, conversation);
        });
      }

      const resolvedConversations = sortConversationsByNewest(Array.from(mergedById.values()));
      setConversations(resolvedConversations);

      if (resolvedConversations.length === 0 && allResult.status === 'rejected' && groupResult.status === 'rejected') {
        setFetchState('error');
        setErrorMessage(t('messagesPage.errors.loadConversations'));
        return [] as ConversationSummary[];
      }

      setFetchState('success');

      if (allResult.status === 'rejected' || groupResult.status === 'rejected') {
        setErrorMessage(t('messagesPage.errors.partialData'));
      }

      return resolvedConversations;
    },
    [t],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

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

  useEffect(() => {
    const targetUserId = searchParams.get('userId')?.trim();
    if (!targetUserId) {
      return;
    }

    const clearTargetUserParam = () => {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('userId');
      setSearchParams(nextSearchParams, { replace: true });
    };

    const existingConversation = privateConversationByUserId.get(targetUserId);
    if (existingConversation) {
      setSelectedConversationId(existingConversation.conversationId);
      clearTargetUserParam();
      return;
    }

    const targetFriend = friendCandidates.find((friend) => friend.id === targetUserId);
    const knownPrivateConversationIds = new Set(
      decoratedConversations
        .filter((conversation) => conversation.type === 'PRIVATE')
        .map((conversation) => conversation.conversationId),
    );

    if (pendingUserChatCreationRef.current === targetUserId) {
      return;
    }

    let isCancelled = false;
    pendingUserChatCreationRef.current = targetUserId;

    const ensureConversation = async () => {
      try {
        await messageService.createPrivateConversation(currentUser.id, targetUserId);
      } catch {
        // Conversation may already exist. Continue by reloading list.
      }

      const refreshedConversations = await loadConversations({ silent: true });
      if (isCancelled) {
        return;
      }

      let matchedConversation: ConversationSummary | undefined;

      if (targetFriend) {
        const candidateNames = new Set(
          [targetFriend.fullName, targetFriend.username]
            .map((name) => normalizeText(name))
            .filter((name) => name.length > 0),
        );

        matchedConversation = refreshedConversations.find(
          (conversation) =>
            conversation.type === 'PRIVATE' && candidateNames.has(normalizeText(conversation.name)),
        );
      }

      if (!matchedConversation) {
        matchedConversation = refreshedConversations.find(
          (conversation) =>
            conversation.type === 'PRIVATE' &&
            !knownPrivateConversationIds.has(conversation.conversationId),
        );
      }

      if (!matchedConversation && targetFriend) {
        // Fallback if backend returned existing conversation but naming does not match exactly.
        matchedConversation = refreshedConversations.find((conversation) => conversation.type === 'PRIVATE');
      }

      if (matchedConversation) {
        setSelectedConversationId(matchedConversation.conversationId);
      }

      clearTargetUserParam();
    };

    void ensureConversation().finally(() => {
      if (!isCancelled) {
        pendingUserChatCreationRef.current = null;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    currentUser.id,
    decoratedConversations,
    friendCandidates,
    loadConversations,
    privateConversationByUserId,
    searchParams,
    setSearchParams,
  ]);

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

  useEffect(() => {
    if (filteredConversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    if (!selectedConversationId) {
      setSelectedConversationId(filteredConversations[0].conversationId);
      return;
    }

    const stillVisible = filteredConversations.some(
      (conversation) => conversation.conversationId === selectedConversationId,
    );

    if (!stillVisible) {
      setSelectedConversationId(filteredConversations[0].conversationId);
    }
  }, [filteredConversations, selectedConversationId]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) {
      return null;
    }

    return decoratedConversations.find((conversation) => conversation.conversationId === selectedConversationId) ?? null;
  }, [decoratedConversations, selectedConversationId]);

  const selectedMessages = useMemo(() => {
    if (!selectedConversationId) {
      return [];
    }

    return messagesByConversation[selectedConversationId] ?? [];
  }, [messagesByConversation, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    if (loadedConversationIdsRef.current.has(selectedConversationId)) {
      return;
    }

    let isCancelled = false;
    setLoadingConversationId(selectedConversationId);
    setMessageError(null);

    void messageService
      .getMessages(selectedConversationId, { limit: 40 })
      .then((result) => {
        if (isCancelled) {
          return;
        }

        loadedConversationIdsRef.current.add(selectedConversationId);
        setMessagesByConversation((existing) => ({
          ...existing,
          [selectedConversationId]: sortMessagesByOldest(result.messages),
        }));
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setMessagesByConversation((existing) => ({
          ...existing,
          [selectedConversationId]: [],
        }));
        setMessageError(t('messagesPage.errors.loadMessages'));
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }

        setLoadingConversationId((current) => (current === selectedConversationId ? null : current));
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedConversationId, t]);

  useEffect(() => {
    if (!messagesViewportRef.current) {
      return;
    }

    messagesViewportRef.current.scrollTop = messagesViewportRef.current.scrollHeight;
  }, [selectedConversationId, selectedMessages]);

  const handleSendMessage = async () => {
    if (!selectedConversationId || isSending) {
      return;
    }

    const trimmedContent = composerValue.trim();
    if (trimmedContent.length === 0) {
      return;
    }

    const optimisticMessageId = `local-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      messageId: optimisticMessageId,
      conversationId: selectedConversationId,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      content: trimmedContent,
      attachments: [],
      createdAt: new Date().toISOString(),
      status: 'SENT',
      type: 'TEXT',
    };

    setComposerValue('');
    setIsSending(true);
    setMessageError(null);

    setMessagesByConversation((existing) => ({
      ...existing,
      [selectedConversationId]: sortMessagesByOldest([
        ...(existing[selectedConversationId] ?? []),
        optimisticMessage,
      ]),
    }));

    try {
      const sentMessage = await messageService.sendMessage(selectedConversationId, trimmedContent);

      setMessagesByConversation((existing) => ({
        ...existing,
        [selectedConversationId]: sortMessagesByOldest(
          (existing[selectedConversationId] ?? []).map((message) =>
            message.messageId === optimisticMessageId ? sentMessage : message,
          ),
        ),
      }));

      setConversations((existing) =>
        sortConversationsByNewest(
          existing.map((conversation) =>
            conversation.conversationId === selectedConversationId
              ? {
                  ...conversation,
                  lastMessagePreview: sentMessage.content || trimmedContent,
                  lastMessageAt: sentMessage.createdAt,
                  lastSenderId: currentUser.id,
                  lastSenderName: currentUser.fullName,
                  hasUnread: false,
                  unreadCount: 0,
                }
              : conversation,
          ),
        ),
      );
    } catch {
      setMessagesByConversation((existing) => ({
        ...existing,
        [selectedConversationId]: (existing[selectedConversationId] ?? []).filter(
          (message) => message.messageId !== optimisticMessageId,
        ),
      }));
      setComposerValue(trimmedContent);
      setMessageError(t('messagesPage.errors.sendMessage'));
    } finally {
      setIsSending(false);
    }
  };

  const closeGroupDialog = () => {
    if (isCreatingGroup) {
      return;
    }

    setIsCreateGroupOpen(false);
    setGroupName('');
    setSelectedMemberIds([]);
    setGroupError(null);
  };

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((existing) =>
      existing.includes(userId)
        ? existing.filter((memberId) => memberId !== userId)
        : [...existing, userId],
    );
  };

  const handleCreateGroup = async () => {
    const trimmedGroupName = groupName.trim();

    if (trimmedGroupName.length === 0) {
      setGroupError(t('messagesPage.errors.groupNameRequired'));
      return;
    }

    if (selectedMemberIds.length === 0) {
      setGroupError(t('messagesPage.errors.groupMemberRequired'));
      return;
    }

    setIsCreatingGroup(true);
    setGroupError(null);

    try {
      await messageService.createGroupConversation({
        currentUserId: currentUser.id,
        name: trimmedGroupName,
        memberIds: selectedMemberIds,
      });

      setIsCreateGroupOpen(false);
      setGroupName('');
      setSelectedMemberIds([]);
      setGroupError(null);
      setActiveTab('groups');
      await loadConversations({ silent: true });
    } catch {
      setGroupError(t('messagesPage.errors.createGroup'));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const tabCount = (tab: ChatFilterTab): number => {
    if (tab === 'friends') {
      return decoratedConversations.filter((conversation) => conversation.type === 'PRIVATE').length;
    }

    if (tab === 'groups') {
      return decoratedConversations.filter((conversation) => conversation.type === 'GROUP').length;
    }

    return decoratedConversations.length;
  };

  if (fetchState === 'loading') {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="grid min-h-[75vh] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 dark:border-slate-700 lg:border-b-0 lg:border-r">
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('messagesPage.title')}</h1>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                >
                  <Plus size={14} />
                  {t('messagesPage.createGroup')}
                </button>
              </div>

              <label className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={t('messagesPage.searchPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                {chatTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      activeTab === tab.id
                        ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                        : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100',
                    )}
                  >
                    {tab.label}
                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {tabCount(tab.id)}
                    </span>
                  </button>
                ))}
              </div>

              {errorMessage ? (
                <p className="rounded-xl border border-amber-300/50 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                  {errorMessage}
                </p>
              ) : null}
            </div>
            <div className="max-h-[calc(75vh-9.75rem)] space-y-1 overflow-y-auto px-2 pb-3">
              {filteredConversations.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t('messagesPage.empty')}
                </p>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.conversationId)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition',
                      selectedConversationId === conversation.conversationId
                        ? 'bg-brand-100/80 dark:bg-brand-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80',
                    )}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conversation.displayAvatar}
                        alt={conversation.name}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      {conversation.type === 'PRIVATE' && conversation.isOnline ? (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {conversation.name}
                        </p>
                        <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                          {conversation.lastMessageAt ? formatRelativeTime(conversation.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {conversation.lastMessagePreview || t('messagesPage.noMessagesYet')}
                      </p>
                    </div>

                    {conversation.unreadCount > 0 ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="flex min-h-[75vh] flex-col">
            {selectedConversation ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div className="relative">
                    <img
                      src={selectedConversation.displayAvatar}
                      alt={selectedConversation.name}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                    {selectedConversation.type === 'PRIVATE' && selectedConversation.isOnline ? (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedConversation.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedConversation.type === 'GROUP'
                        ? t('messagesPage.groupMembers', { count: selectedConversation.memberCount })
                        : selectedConversation.isOnline
                          ? t('messagesPage.onlineNow')
                          : t('messagesPage.offline')}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {selectedConversation.type === 'GROUP' ? (
                      <UsersRound size={12} />
                    ) : (
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                    {selectedConversation.type === 'GROUP'
                      ? t('messagesPage.tabs.groups')
                      : t('messagesPage.tabs.friends')}
                  </span>
                </header>

                <div
                  ref={messagesViewportRef}
                  className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-900/40"
                >
                  {loadingConversationId === selectedConversation.conversationId ? (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
                  ) : null}

                  {messageError ? (
                    <p className="rounded-xl border border-amber-300/50 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                      {messageError}
                    </p>
                  ) : null}

                  {selectedMessages.length === 0 && loadingConversationId !== selectedConversation.conversationId ? (
                    <p className="pt-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t('messagesPage.noMessagesYet')}
                    </p>
                  ) : (
                    selectedMessages.map((message) => {
                      const isMine = message.senderId === currentUser.id;

                      return (
                        <div
                          key={message.messageId}
                          className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}
                        >
                          <div className={clsx('max-w-[80%]', isMine ? 'items-end' : 'items-start')}>
                            {!isMine && selectedConversation.type === 'GROUP' ? (
                              <p className="mb-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {message.senderName}
                              </p>
                            ) : null}

                            <div
                              className={clsx(
                                'rounded-2xl px-3 py-2 text-sm',
                                isMine
                                  ? 'rounded-br-md bg-brand-600 text-white'
                                  : 'rounded-bl-md bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100',
                              )}
                            >
                              {message.content || t('messagesPage.attachmentOnly')}
                            </div>

                            <p
                              className={clsx(
                                'mt-1 text-[11px] text-slate-500 dark:text-slate-400',
                                isMine ? 'text-right' : 'text-left',
                              )}
                            >
                              {formatRelativeTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSendMessage();
                  }}
                  className="border-t border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={composerValue}
                      onChange={(event) => setComposerValue(event.target.value)}
                      placeholder={t('messagesPage.composerPlaceholder')}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={composerValue.trim().length === 0 || isSending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full min-h-[75vh] items-center justify-center p-6 text-center">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t('messagesPage.placeholderTitle')}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('messagesPage.placeholderDescription')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {isCreateGroupOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeGroupDialog}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
            aria-label={t('messagesPage.closeCreateGroup')}
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-cyan-500" />

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t('messagesPage.createGroupDialog.title')}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t('messagesPage.createGroupDialog.description')}
                </p>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('messagesPage.createGroupDialog.groupNameLabel')}
                </span>
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder={t('messagesPage.createGroupDialog.groupNamePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t('messagesPage.createGroupDialog.membersLabel')}
                </p>

                {friendCandidates.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/40 dark:text-slate-400">
                    {t('messagesPage.createGroupDialog.noFriends')}
                  </p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                    {friendCandidates.map((friend) => {
                      const isSelected = selectedMemberIds.includes(friend.id);

                      return (
                        <label
                          key={friend.id}
                          className={clsx(
                            'flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition',
                            isSelected
                              ? 'bg-brand-100/70 dark:bg-brand-500/20'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleMember(friend.id)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <div className="relative">
                            <img src={friend.avatarUrl} alt={friend.fullName} className="h-10 w-10 rounded-full object-cover" />
                            {friend.isOnline ? (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {friend.fullName}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">@{friend.username}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {groupError ? (
                <p className="rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
                  {groupError}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeGroupDialog}
                  disabled={isCreatingGroup}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateGroup()}
                  disabled={isCreatingGroup}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingGroup ? t('messagesPage.creatingGroup') : t('messagesPage.createGroup')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
