export interface ConversationResponseDto {
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

export interface MessageAttachmentResponseDto {
  attachmentId?: string;
  url?: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

export interface MessageResponseDto {
  messageId?: string;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  content?: string | null;
  attachments?: MessageAttachmentResponseDto[] | null;
  status?: string;
  type?: string;
  createdAt?: string;
}

export interface MessageCursorResponseDto {
  createdAt?: string;
  messageId?: string;
}

export interface MessageCursorPageResponseDto {
  messages?: MessageResponseDto[] | null;
  nextCursor?: MessageCursorResponseDto | null;
}
