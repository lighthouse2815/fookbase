import { javaApiClient } from '../apiClient';
import type {
  ChatMessage,
  ConversationSummary,
  CreateGroupConversationInput,
  MessageCursorPage,
  ConversationPayload, 
  MessageCursorPagePayload, 
  MessagePayload 
} from '@/interface/message';

import { 
  sanitizeConversation, 
  sanitizeMessage 
} from './util';

export const messageService = {
  async getConversationsByUser(): Promise<ConversationSummary[]> {
    const response = await javaApiClient.get<ConversationPayload[]>('/api/messenger/conversations/getByUser');
    return Array.isArray(response.data)
      ? response.data.map((conversation, index) => sanitizeConversation(conversation, index))
      : [];
  },

  async getGroupsByUser(): Promise<ConversationSummary[]> {
    const response = await javaApiClient.get<ConversationPayload[]>('/api/messenger/conversations/getGroupByUser');
    return Array.isArray(response.data)
      ? response.data.map((conversation, index) => sanitizeConversation(conversation, index))
      : [];
  },

  async getMessages(
    conversationId: string,
    options?: {
      cursorCreatedAt?: string;
      cursorMessageId?: string;
      limit?: number;
    },
  ): Promise<MessageCursorPage> {
    const response = await javaApiClient.get<MessageCursorPagePayload>(
      `/api/messenger/messages/conversation/${conversationId}`,
      {
        params: {
          cursorCreatedAt: options?.cursorCreatedAt,
          cursorMessageId: options?.cursorMessageId,
          limit: options?.limit ?? 40,
        },
      },
    );

    const payload = response.data;
    const messages = Array.isArray(payload.messages)
      ? payload.messages.map((message, index) => sanitizeMessage(message, index))
      : [];

    return {
      messages,
      nextCursor:
        payload.nextCursor?.createdAt && payload.nextCursor?.messageId
          ? {
              createdAt: payload.nextCursor.createdAt,
              messageId: payload.nextCursor.messageId,
            }
          : null,
    };
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const response = await javaApiClient.post<MessagePayload>('/api/messenger/messages/send', {
      conversationId,
      content,
    });

    return sanitizeMessage(response.data, 0);
  },

  async createGroupConversation(input: CreateGroupConversationInput): Promise<void> {
    const uniqueMembers = Array.from(new Set([input.currentUserId, ...input.memberIds]))
      .filter((memberId) => memberId.trim().length > 0)
      .map((memberId) => ({
        userId: memberId,
        role: memberId === input.currentUserId ? 'ADMIN' : 'MEMBER',
      }));

    await javaApiClient.post('/api/messenger/conversations/create', {
      type: 'GROUP',
      name: input.name.trim(),
      members: uniqueMembers,
    });
  },

  async createPrivateConversation(currentUserId: string, targetUserId: string): Promise<void> {
    const uniqueMembers = Array.from(new Set([currentUserId, targetUserId]))
      .filter((memberId) => memberId.trim().length > 0)
      .map((memberId) => ({
        userId: memberId,
        role: 'MEMBER',
      }));

    await javaApiClient.post('/api/messenger/conversations/create', {
      type: 'PRIVATE',
      members: uniqueMembers,
    });
  },
};
