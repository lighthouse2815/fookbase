import { javaApiClient } from './apiClient';
import type {
  ChatMessage,
  ConversationSummary,
  ConversationType,
  CreateGroupConversationInput,
  MessageAttachment,
  MessageCursorPage,
} from '../types/message';

interface ConversationPayload {
  conversationId?: string;
  id?: string;
  name?: string | null;
  avatarUrl?: string | null;
  type?: string;
  lastSenderId?: string | null;
  lastSenderName?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number | null;
  hasUnread?: boolean | null;
  memberCount?: number | null;
}

interface MessageAttachmentPayload {
  attachmentId?: string;
  url?: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

interface MessagePayload {
  messageId?: string;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  content?: string | null;
  attachments?: MessageAttachmentPayload[] | null;
  status?: string;
  type?: string;
  createdAt?: string;
}

interface MessageCursorPayload {
  createdAt?: string;
  messageId?: string;
}

interface MessageCursorPagePayload {
  messages?: MessagePayload[] | null;
  nextCursor?: MessageCursorPayload | null;
}

const toStringOrFallback = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return fallback;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return undefined;
};

const toOptionalNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  return toOptionalString(value);
};

const toNumberOrDefault = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return fallback;
};

const toBooleanOrDefault = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
};

const normalizeConversationType = (value: unknown): ConversationType => {
  if (typeof value === 'string' && value.toUpperCase() === 'GROUP') {
    return 'GROUP';
  }

  return 'PRIVATE';
};

const sanitizeConversation = (payload: ConversationPayload, index: number): ConversationSummary => {
  const conversationId = toStringOrFallback(payload.conversationId ?? payload.id, `conversation-${index}`);
  const type = normalizeConversationType(payload.type);

  return {
    conversationId,
    name: toStringOrFallback(payload.name, type === 'GROUP' ? 'Nhom moi' : 'Tin nhan'),
    avatarUrl: toOptionalNullableString(payload.avatarUrl),
    type,
    lastSenderId: toOptionalNullableString(payload.lastSenderId),
    lastSenderName: toOptionalString(payload.lastSenderName) ?? '',
    lastMessagePreview: toOptionalString(payload.lastMessagePreview) ?? '',
    lastMessageAt: toOptionalNullableString(payload.lastMessageAt),
    unreadCount: toNumberOrDefault(payload.unreadCount, 0),
    hasUnread: toBooleanOrDefault(payload.hasUnread, false),
    memberCount: toNumberOrDefault(payload.memberCount, 2),
  };
};

const sanitizeAttachment = (payload: MessageAttachmentPayload, index: number): MessageAttachment => {
  return {
    attachmentId: toStringOrFallback(payload.attachmentId, `attachment-${index}`),
    url: toStringOrFallback(payload.url, ''),
    type: toOptionalString(payload.type),
    fileName: toOptionalString(payload.fileName),
    fileSize: toNumberOrDefault(payload.fileSize, 0),
    contentType: toOptionalString(payload.contentType),
  };
};

const sanitizeMessage = (payload: MessagePayload, index: number): ChatMessage => {
  const messageId = toStringOrFallback(payload.messageId, `message-${index}`);
  const conversationId = toStringOrFallback(payload.conversationId, '');

  return {
    messageId,
    conversationId,
    senderId: toStringOrFallback(payload.senderId, ''),
    senderName: toStringOrFallback(payload.senderName, 'Unknown'),
    content: toOptionalString(payload.content) ?? '',
    attachments: Array.isArray(payload.attachments)
      ? payload.attachments.map((attachment, attachmentIndex) =>
          sanitizeAttachment(attachment, attachmentIndex),
        )
      : [],
    status: toOptionalString(payload.status),
    type: toOptionalString(payload.type),
    createdAt: toStringOrFallback(payload.createdAt, new Date().toISOString()),
  };
};

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
