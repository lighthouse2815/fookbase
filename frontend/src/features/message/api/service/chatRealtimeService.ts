import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

import { storage } from '@/shared/storage/storage';
import type { ChatRealtimeConnection, SendRealtimeMessageInput } from '@/features/message/types/contracts';
import type { ChatRealtimeHandlers } from '@/features/message/api/service/types';
import { getJavaApiBaseUrl, sanitizeIncomingMessage, toWebSocketUrl } from '@/features/message/utils/realtime.util';

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
                handlers.onError?.('Không thể xử lý dữ liệu realtime.');
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
      handlers.onError?.(frame.headers.message ?? 'Kết nối realtime gặp lỗi.');
    },
    onWebSocketError: () => {
      handlers.onError?.('Kết nối websocket gặp lỗi.');
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
          handlers.onError?.('Không thể xử lý dữ liệu realtime.');
        }
      },
    );

    activeSubscriptions.set(conversationId, subscription);
  };

  return {
    connect: () => {
      const token = storage.getToken();
      if (!token) {
        handlers.onError?.('Không tìm thấy token đăng nhập để kết nối realtime.');
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

export type { ChatRealtimeConnection, SendRealtimeMessageInput } from '@/features/message/types/contracts';
