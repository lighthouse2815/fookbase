import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

import { storage } from '@/utils/storage';
import type { ChatRealtimeConnection } from '@/interface/chatRealtime';
import type { SendRealtimeMessageInput } from '@/interface/chatRealtime';
import type { ChatRealtimeHandlers } from '@/services/chatRealtime/interface';
import { getJavaApiBaseUrl, sanitizeIncomingMessage, toWebSocketUrl } from '@/services/chatRealtime/util';

export const createChatRealtimeConnection = (handlers: ChatRealtimeHandlers): ChatRealtimeConnection => {
  const socketUrl = toWebSocketUrl(getJavaApiBaseUrl());
  const wantedConversationIds = new Set<string>();
  const activeSubscriptions = new Map<string, StompSubscription>();

  const client = new Client({
    brokerURL: socketUrl,
    beforeConnect: () => {
      const token = storage.getToken();
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {
      // Intentionally silent in production UI.
    },
    onConnect: () => {
      handlers.onConnectionChange?.(true);

      wantedConversationIds.forEach((conversationId) => {
        if (!activeSubscriptions.has(conversationId)) {
          const subscription = client.subscribe(
            `/user/queue/conversation/${conversationId}/messages`,
            (frame: IMessage) => {
              try {
                const parsed = JSON.parse(frame.body);
                const message = sanitizeIncomingMessage(parsed);
                if (message) {
                  handlers.onMessage(message);
                }
              } catch {
                handlers.onError?.('Khong the xu ly du lieu realtime.');
              }
            },
          );

          activeSubscriptions.set(conversationId, subscription);
        }
      });
    },
    onDisconnect: () => {
      handlers.onConnectionChange?.(false);
    },
    onWebSocketClose: () => {
      handlers.onConnectionChange?.(false);
    },
    onStompError: (frame) => {
      handlers.onError?.(frame.headers.message ?? 'Ket noi realtime gap loi.');
    },
    onWebSocketError: () => {
      handlers.onError?.('Ket noi websocket gap loi.');
    },
  });

  const subscribeConversation = (conversationId: string) => {
    if (!conversationId) {
      return;
    }

    wantedConversationIds.add(conversationId);

    if (!client.connected || activeSubscriptions.has(conversationId)) {
      return;
    }

    const subscription = client.subscribe(
      `/user/queue/conversation/${conversationId}/messages`,
      (frame: IMessage) => {
        try {
          const parsed = JSON.parse(frame.body);
          const message = sanitizeIncomingMessage(parsed);
          if (message) {
            handlers.onMessage(message);
          }
        } catch {
          handlers.onError?.('Khong the xu ly du lieu realtime.');
        }
      },
    );

    activeSubscriptions.set(conversationId, subscription);
  };

  return {
    connect: () => {
      const token = storage.getToken();
      if (!token) {
        handlers.onError?.('Khong tim thay token dang nhap de ket noi realtime.');
        return;
      }

      if (!client.active) {
        client.activate();
      }
    },
    disconnect: () => {
      activeSubscriptions.forEach((subscription) => subscription.unsubscribe());
      activeSubscriptions.clear();
      wantedConversationIds.clear();
      if (client.active) {
        void client.deactivate();
      }
    },
    subscribeConversation,
    unsubscribeConversation: (conversationId: string) => {
      wantedConversationIds.delete(conversationId);
      const subscription = activeSubscriptions.get(conversationId);
      if (subscription) {
        subscription.unsubscribe();
        activeSubscriptions.delete(conversationId);
      }
    },
    sendMessage: (input: SendRealtimeMessageInput) => {
      if (!client.connected) {
        throw new Error('Realtime is not connected.');
      }

      client.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          conversationId: input.conversationId,
          content: input.content,
        }),
      });
    },
    isConnected: () => client.connected,
  };
};

export type { ChatRealtimeConnection, SendRealtimeMessageInput } from '@/interface/chatRealtime';
