import type {
  ChatMessage,
  ConversationSummary,
  ConversationType,
  CreateGroupConversationInput,
  MessageAttachment,
  MessageCursorPage,
} from '@/features/message/types/contracts';
import type {
  CreateConversationRequestDto,
  ConversationMemberRequestDto,
} from '@/features/message/api/dtos/request.dto';
import type {
  ConversationResponseDto,
  MessageAttachmentResponseDto,
  MessageCursorPageResponseDto,
  MessageResponseDto,
} from '@/features/message/api/dtos/response.dto';

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
  if (typeof value === 'string' && value.trim().toUpperCase() === 'GROUP') {
    return 'GROUP';
  }

  return 'PRIVATE';
};

export const mapConversationResponseDtoToConversationSummary = (
  dto: ConversationResponseDto,
  index: number,
): ConversationSummary => {
  const conversationId = toStringOrFallback(dto.conversationId ?? dto.id, `conversation-${index}`);
  const type = normalizeConversationType(dto.type);

  return {
    conversationId,
    name: toStringOrFallback(dto.name, type === 'GROUP' ? 'Nhom moi' : 'Tin nhan'),
    avatarUrl: toOptionalNullableString(dto.avatarUrl),
    type,
    lastSenderId: toOptionalNullableString(dto.lastSenderId),
    lastSenderName: toOptionalString(dto.lastSenderName) ?? '',
    lastMessagePreview: toOptionalString(dto.lastMessagePreview) ?? '',
    lastMessageAt: toOptionalNullableString(dto.lastMessageAt),
    unreadCount: toNumberOrDefault(dto.unreadCount, 0),
    hasUnread: toBooleanOrDefault(dto.hasUnread, false),
    memberCount: toNumberOrDefault(dto.memberCount, 2),
  };
};

export const mapMessageAttachmentResponseDtoToMessageAttachment = (
  dto: MessageAttachmentResponseDto,
  index: number,
): MessageAttachment => ({
  attachmentId: toStringOrFallback(dto.attachmentId, `attachment-${index}`),
  url: toStringOrFallback(dto.url, ''),
  type: toOptionalString(dto.type),
  fileName: toOptionalString(dto.fileName),
  fileSize: toNumberOrDefault(dto.fileSize, 0),
  contentType: toOptionalString(dto.contentType),
});

export const mapMessageResponseDtoToChatMessage = (dto: MessageResponseDto, index: number): ChatMessage => ({
  messageId: toStringOrFallback(dto.messageId, `message-${index}`),
  conversationId: toStringOrFallback(dto.conversationId, ''),
  senderId: toStringOrFallback(dto.senderId, ''),
  senderName: toStringOrFallback(dto.senderName, 'Unknown'),
  content: toOptionalString(dto.content) ?? '',
  attachments: Array.isArray(dto.attachments)
    ? dto.attachments.map((attachment, attachmentIndex) =>
      mapMessageAttachmentResponseDtoToMessageAttachment(attachment, attachmentIndex))
    : [],
  status: toOptionalString(dto.status),
  type: toOptionalString(dto.type),
  createdAt: toStringOrFallback(dto.createdAt, new Date().toISOString()),
});

export const mapMessageCursorPageResponseDtoToMessageCursorPage = (
  dto: MessageCursorPageResponseDto,
): MessageCursorPage => ({
  messages: Array.isArray(dto.messages) ? dto.messages.map(mapMessageResponseDtoToChatMessage) : [],
  nextCursor:
    dto.nextCursor?.createdAt && dto.nextCursor?.messageId
      ? {
        createdAt: dto.nextCursor.createdAt,
        messageId: dto.nextCursor.messageId,
      }
      : null,
});

const toMemberRequestDto = (
  memberId: string,
  role: ConversationMemberRequestDto['role'],
): ConversationMemberRequestDto => ({
  userId: memberId,
  role,
});

export const mapCreateGroupConversationInputToRequestDto = (
  input: CreateGroupConversationInput,
): CreateConversationRequestDto => {
  const members = Array.from(new Set([input.currentUserId, ...input.memberIds]))
    .filter((memberId) => memberId.trim().length > 0)
    .map((memberId) => toMemberRequestDto(memberId, memberId === input.currentUserId ? 'ADMIN' : 'MEMBER'));

  return {
    type: 'GROUP',
    name: input.name.trim(),
    members,
  };
};

export const mapCreatePrivateConversationInputToRequestDto = (
  currentUserId: string,
  targetUserId: string,
): CreateConversationRequestDto => {
  const members = Array.from(new Set([currentUserId, targetUserId]))
    .filter((memberId) => memberId.trim().length > 0)
    .map((memberId) => toMemberRequestDto(memberId, 'MEMBER'));

  return {
    type: 'PRIVATE',
    members,
  };
};
