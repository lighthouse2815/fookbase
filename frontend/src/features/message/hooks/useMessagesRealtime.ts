import { useEffect, useRef, useState } from 'react';

import { createChatRealtimeConnection, type ChatRealtimeConnection } from '@/features/message/api/service/chatRealtimeService';
import type { ChatMessage } from '@/features/message/types/contracts';

interface UseMessagesRealtimeInput {
  onMessage: (message: ChatMessage) => void;
  selectedConversationId: string | null;
}

export const useMessagesRealtime = ({ onMessage, selectedConversationId }: UseMessagesRealtimeInput): boolean => {
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const realtimeConnectionRef = useRef<ChatRealtimeConnection | null>(null);

  useEffect(() => {
    const connection = createChatRealtimeConnection({
      onMessage: (message) => {
        onMessage(message);
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
  }, [onMessage]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    realtimeConnectionRef.current?.subscribeConversation(selectedConversationId);

    return () => {
      realtimeConnectionRef.current?.unsubscribeConversation(selectedConversationId);
    };
  }, [selectedConversationId]);

  return isRealtimeConnected;
};
