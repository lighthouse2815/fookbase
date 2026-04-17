import type { ChatMessage } from '@/interface/message';

export const getJavaApiBaseUrl = (): string =>
  import.meta.env.VITE_JAVA_API_BASE_URL ?? 'http://localhost:8080';

export const toWebSocketUrl = (httpUrl: string): string => {
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

export const sanitizeIncomingMessage = (payload: unknown): ChatMessage | null => {
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
