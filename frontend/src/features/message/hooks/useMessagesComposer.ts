import type { TFunction } from 'i18next';
import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';

import { messageService } from '@/features/message/api/service/messageService';
import type { ChatMessage } from '@/features/message/types/contracts';

interface UseMessagesComposerInput {
  selectedConversationId: string | null;
  t: TFunction;
  onMessageSent: (message: ChatMessage) => void;
  setMessageError: Dispatch<SetStateAction<string | null>>;
}

interface UseMessagesComposerReturn {
  composerValue: string;
  setComposerValue: Dispatch<SetStateAction<string>>;
  isSending: boolean;
  handleSendMessage: () => Promise<void>;
}

export const useMessagesComposer = ({
  selectedConversationId,
  t,
  onMessageSent,
  setMessageError,
}: UseMessagesComposerInput): UseMessagesComposerReturn => {
  const [composerValue, setComposerValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = useCallback(async () => {
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
      onMessageSent(sentMessage);
    } catch {
      setComposerValue(trimmedContent);
      setMessageError(t('messagesPage.errors.sendMessage'));
    } finally {
      setIsSending(false);
    }
  }, [composerValue, isSending, onMessageSent, selectedConversationId, setMessageError, t]);

  return {
    composerValue,
    setComposerValue,
    isSending,
    handleSendMessage,
  };
};
