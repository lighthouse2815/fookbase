import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';

import { messageService } from '@/features/message/api/service/messageService';
import type { ConversationSummary } from '@/features/message/types/contracts';
import type { ConversationListItem } from '@/features/message/types/hooks';
import { normalizeText } from '@/features/message/utils/page.util';
import type { User } from '@/features/user/types/contracts';

interface UseEnsureConversationFromQueryInput {
  currentUserId: string;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  privateConversationByUserId: Map<string, ConversationListItem>;
  friendCandidates: User[];
  decoratedConversations: ConversationListItem[];
  loadConversations: (options?: { silent?: boolean }) => Promise<ConversationSummary[]>;
  setSelectedConversationId: Dispatch<SetStateAction<string | null>>;
}

export const useEnsureConversationFromQuery = ({
  currentUserId,
  searchParams,
  setSearchParams,
  privateConversationByUserId,
  friendCandidates,
  decoratedConversations,
  loadConversations,
  setSelectedConversationId,
}: UseEnsureConversationFromQueryInput): void => {
  const pendingUserChatCreationRef = useRef<string | null>(null);

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
        await messageService.createPrivateConversation(currentUserId, targetUserId);
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
    currentUserId,
    decoratedConversations,
    friendCandidates,
    loadConversations,
    privateConversationByUserId,
    searchParams,
    setSearchParams,
    setSelectedConversationId,
  ]);
};

