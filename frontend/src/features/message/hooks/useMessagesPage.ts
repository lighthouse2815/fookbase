import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { ChatMessage, ConversationSummary } from '@/features/message/types/contracts';
import type { MainLayoutOutletContext } from '@/shared/types/layout';
import { messageService } from '@/features/message/api/service/messageService';
import { useEnsureConversationFromQuery } from '@/features/message/hooks/useEnsureConversationFromQuery';
import { useMessagesComposer } from '@/features/message/hooks/useMessagesComposer';
import { useMessagesDerivedData } from '@/features/message/hooks/useMessagesDerivedData';
import { useMessagesGroupCreation } from '@/features/message/hooks/useMessagesGroupCreation';
import { useMessagesRealtime } from '@/features/message/hooks/useMessagesRealtime';
import { useMessagesViewport } from '@/features/message/hooks/useMessagesViewport';

import type { UseMessagesPageReturn } from '@/features/message/types/hooks';
import type { ChatFilterTab, FetchState } from '@/features/message/types/pages';
import {
  sortConversationsByNewest,
  sortMessagesByOldest,
} from '@/features/message/utils/page.util';

export const useMessagesPage = (): UseMessagesPageReturn => {
  const { t } = useTranslation();
  const { currentUser, onlineUsers, offlineUsers } = useOutletContext<MainLayoutOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [activeTab, setActiveTab] = useState<ChatFilterTab>('all');
  const [searchValue, setSearchValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMobileViewport = useMessagesViewport();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const loadedConversationIdsRef = useRef<Set<string>>(new Set());
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const selectedConversationIdRef = useRef<string | null>(null);

  const {
    chatTabs,
    friendCandidates,
    decoratedConversations,
    privateConversationByUserId,
    filteredConversations,
    tabCount,
  } = useMessagesDerivedData({
    t,
    currentUserId: currentUser.id,
    onlineUsers,
    offlineUsers,
    conversations,
    activeTab,
    searchValue,
  });

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

  const isRealtimeConnected = useMessagesRealtime({
    onMessage: applyIncomingMessage,
    selectedConversationId,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadConversations();
  }, [loadConversations]);

  useEnsureConversationFromQuery({
    currentUserId: currentUser.id,
    searchParams,
    setSearchParams,
    privateConversationByUserId,
    friendCandidates,
    decoratedConversations,
    loadConversations,
    setSelectedConversationId,
  });

  useEffect(() => {
    if (filteredConversations.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedConversationId(null);
      return;
    }

    if (!selectedConversationId) {
      if (!isMobileViewport) {
        setSelectedConversationId(filteredConversations[0].conversationId);
      }
      return;
    }

    const stillVisible = filteredConversations.some(
      (conversation) => conversation.conversationId === selectedConversationId,
    );

    if (!stillVisible) {
      setSelectedConversationId(isMobileViewport ? null : filteredConversations[0].conversationId);
    }
  }, [filteredConversations, isMobileViewport, selectedConversationId]);

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

    if (loadedConversationIdsRef.current.has(selectedConversationId)) {
      return;
    }

    let isCancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const { composerValue, setComposerValue, isSending, handleSendMessage } = useMessagesComposer({
    selectedConversationId,
    t,
    onMessageSent: applyIncomingMessage,
    setMessageError,
  });
  const {
    isCreateGroupOpen,
    setIsCreateGroupOpen,
    groupName,
    setGroupName,
    selectedMemberIds,
    groupError,
    isCreatingGroup,
    closeGroupDialog,
    handleToggleMember,
    handleCreateGroup,
  } = useMessagesGroupCreation({
    t,
    currentUserId: currentUser.id,
    setActiveTab: (tab) => setActiveTab(tab),
    loadConversations,
  });

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
    isMobileViewport,
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


