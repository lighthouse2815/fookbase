import type { ChatMessage, MessagePayload } from "@/interface/message";
import type { MessageAttachment } from "@/interface/message";
import type { MessageAttachmentPayload } from "@/interface/message";
import type { ConversationSummary } from "@/interface/message";
import type { ConversationPayload } from "@/interface/message";
import type { ConversationType } from "@/interface/message";

export const toStringOrFallback = (value: unknown, fallback: string): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  
    return fallback;
  };
  
export const toOptionalString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  
    return undefined;
  };
  
export const toOptionalNullableString = (value: unknown): string | null | undefined => {
    if (value === null) {
      return null;
    }
  
    return toOptionalString(value);
  };
  
export const toNumberOrDefault = (value: unknown, fallback: number): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  
    return fallback;
  };
  
export const toBooleanOrDefault = (value: unknown, fallback: boolean): boolean => {
    if (typeof value === 'boolean') {
      return value;
    }
  
    return fallback;
  };
  
export const normalizeConversationType = (value: unknown): ConversationType => {
    if (typeof value === 'string' && value.toUpperCase() === 'GROUP') {
      return 'GROUP';
    }
  
    return 'PRIVATE';
  };
  
export const sanitizeConversation = (payload: ConversationPayload, index: number): ConversationSummary => {
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
  
export const sanitizeAttachment = (payload: MessageAttachmentPayload, index: number): MessageAttachment => {
    return {
      attachmentId: toStringOrFallback(payload.attachmentId, `attachment-${index}`),
      url: toStringOrFallback(payload.url, ''),
      type: toOptionalString(payload.type),
      fileName: toOptionalString(payload.fileName),
      fileSize: toNumberOrDefault(payload.fileSize, 0),
      contentType: toOptionalString(payload.contentType),
    };
  };
  
export  const sanitizeMessage = (payload: MessagePayload, index: number): ChatMessage => {
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