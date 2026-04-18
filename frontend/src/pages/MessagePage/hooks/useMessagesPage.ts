import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { ChatMessage, ConversationSummary } from '@/interface/message';
import type { User } from '@/interface/user';
import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { createChatRealtimeConnection, type ChatRealtimeConnection } from '@/services/chatRealtimeService';
import { messageService } from '@/services/messageService';

import type { ConversationListItem, UseMessagesPageReturn } from '../interface';
import type { ChatFilterTab, FetchState } from '../type';
import {
  buildFallbackAvatar,
  dedupeUsersById,
  normalizeText,
  sortConversationsByNewest,
  sortMessagesByOldest,
} from '../util';

export const useMessagesPage = (): UseMessagesPageReturn => {
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
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const loadedConversationIdsRef = useRef<Set<string>>(new Set());
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const pendingUserChatCreationRef = useRef<string | null>(null);
  const realtimeConnectionRef = useRef<ChatRealtimeConnection | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);

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

  const applyIncomingMessage = useCallback(
    (incomingMessage: ChatMessage) => {
      loadedConversationIdsRef.current.add(incomingMessage.conversationId);

      setMessagesByConversation((existing) => {
        const currentMessages = existing[incomingMessage.conversationId] ?? [];
        if (currentMessages.some((message) => message.messageId === incomingMessage.messageId)) {
          return existing;
        }

        return {
          ...existing,
          [incomingMessage.conversationId]: sortMessagesByOldest([...currentMessages, incomingMessage]),
        };
      });

      setConversations((existing) => {
        const activeConversationId = selectedConversationIdRef.current;
        const conversationExists = existing.some(
          (conversation) => conversation.conversationId === incomingMessage.conversationId,
        );

        if (!conversationExists) {
          void loadConversations({ silent: true });
          return existing;
        }

        return sortConversationsByNewest(
          existing.map((conversation) =>
            conversation.conversationId === incomingMessage.conversationId
              ? {
                  ...conversation,
                  lastMessagePreview: incomingMessage.content || conversation.lastMessagePreview,
                  lastMessageAt: incomingMessage.createdAt,
                  lastSenderId: incomingMessage.senderId,
                  lastSenderName: incomingMessage.senderName,
                  hasUnread:
                    incomingMessage.senderId !== currentUser.id &&
                    activeConversationId !== incomingMessage.conversationId,
                  unreadCount:
                    incomingMessage.senderId !== currentUser.id &&
                    activeConversationId !== incomingMessage.conversationId
                      ? conversation.unreadCount + 1
                      : 0,
                }
              : conversation,
          ),
        );
      });
    },
    [currentUser.id, loadConversations],
  );

  useEffect(() => {
    const connection = createChatRealtimeConnection({
      onMessage: (message) => {
        applyIncomingMessage(message);
      },
      onConnectionChange: (connected) => {
        setIsRealtimeConnected(connected);
      },
      onError: () => {
        setIsRealtimeConnected(false);
      },
    });

    realtimeConnectionRef.current = connection;
    connection.connect();

    return () => {
      connection.disconnect();
      realtimeConnectionRef.current = null;
      setIsRealtimeConnected(false);
    };
  }, [applyIncomingMessage]);

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
            conversation.type === 'PRIVATE' && !knownPrivateConversationIds.has(conversation.conversationId),
        );
      }

      if (!matchedConversation && targetFriend) {
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
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    realtimeConnectionRef.current?.subscribeConversation(selectedConversationId);

    return () => {
      realtimeConnectionRef.current?.unsubscribeConversation(selectedConversationId);
    };
  }, [selectedConversationId]);

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
    setIsSending(true);
    setMessageError(null);
    setComposerValue('');

    try {
      const sentMessage = await messageService.sendMessage(selectedConversationId, trimmedContent);
      applyIncomingMessage(sentMessage);
    } catch {
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
      existing.includes(userId) ? existing.filter((memberId) => memberId !== userId) : [...existing, userId],
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

  return {
    t,
    currentUser,
    fetchState,
    activeTab,
    setActiveTab,
    searchValue,
    setSearchValue,
    errorMessage,
    chatTabs,
    filteredConversations,
    selectedConversationId,
    setSelectedConversationId,
    selectedConversation,
    selectedMessages,
    loadingConversationId,
    messageError,
    composerValue,
    setComposerValue,
    isSending,
    isRealtimeConnected,
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    groupName,
    setGroupName,
    selectedMemberIds,
    groupError,
    isCreatingGroup,
    friendCandidates,
    messagesViewportRef,
    handleSendMessage,
    closeGroupDialog,
    handleToggleMember,
    handleCreateGroup,
    tabCount,
  };
};
