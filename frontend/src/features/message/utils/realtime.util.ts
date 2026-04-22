import { ENV } from '@/shared/env/env';
import type { ChatMessage } from '@/features/message/types/contracts';
import type { MessageResponseDto } from '@/features/message/api/dtos/response.dto';
import { mapMessageResponseDtoToChatMessage } from '@/features/message/api/mapper/mapper';

export const getJavaApiBaseUrl = (): string => ENV.JAVA_API_BASE_URL;

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

  const typed = payload as MessageResponseDto;
  if (!typed.messageId || !typed.conversationId || !typed.senderId || !typed.createdAt) {
    return null;
  }

  return mapMessageResponseDtoToChatMessage(typed, 0);
};
