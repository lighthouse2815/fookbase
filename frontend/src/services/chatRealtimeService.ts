import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';

import { storage } from '../utils/storage';
import type { ChatMessage } from '../types/message';

interface ChatRealtimeHandlers {
  onMessage: (message: ChatMessage) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (message: string) => void;
}

interface SendRealtimeMessageInput {
  conversationId: string;
  content: string;
}

const getJavaApiBaseUrl = (): string =>
  import.meta.env.VITE_JAVA_API_BASE_URL ?? 'http://localhost:8080';

const toWebSocketUrl = (httpUrl: string): string => {
  try {
    const parsed = new URL(httpUrl);
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    parsed.pathname = '/ws';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return 'ws://localhost:8080/ws';
  }
};

const sanitizeIncomingMessage = (payload: unknown): ChatMessage | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const typed = payload as Partial<ChatMessage>;
  if (!typed.messageId || !typed.conversationId || !typed.senderId || !typed.createdAt) {
    return null;
  }

  return {
    messageId: typed.messageId,
    conversationId: typed.conversationId,
    senderId: typed.senderId,
    senderName: typeof typed.senderName === 'string' ? typed.senderName : 'Unknown',
    content: typeof typed.content === 'string' ? typed.content : '',
    attachments: Array.isArray(typed.attachments) ? typed.attachments : [],
    status: typed.status,
    type: typed.type,
    createdAt: typed.createdAt,
  };
};

export interface ChatRealtimeConnection {
  connect: () => void;
  disconnect: () => void;
  subscribeConversation: (conversationId: string) => void;
  unsubscribeConversation: (conversationId: string) => void;
  sendMessage: (input: SendRealtimeMessageInput) => void;
  isConnected: () => boolean;
}

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
