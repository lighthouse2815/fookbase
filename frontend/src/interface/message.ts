export type ConversationType = 'PRIVATE' | 'GROUP';

export interface ConversationSummary {
  conversationId: string;
  name: string;
  avatarUrl?: string | null;
  type: ConversationType;
  lastSenderId?: string | null;
  lastSenderName?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string | null;
  unreadCount: number;
  hasUnread: boolean;
  memberCount: number;
}

export interface MessageAttachment {
  attachmentId: string;
  url: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachments: MessageAttachment[];
  status?: string;
  type?: string;
  createdAt: string;
}

export interface MessageCursor {
  createdAt: string;
  messageId: string;
}

export interface MessageCursorPage {
  messages: ChatMessage[];
  nextCursor: MessageCursor | null;
}

export interface CreateGroupConversationInput {
  currentUserId: string;
  name: string;
  memberIds: string[];
}

export interface ConversationPayload {
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

export interface MessageAttachmentPayload {
  attachmentId?: string;
  url?: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

export interface MessagePayload {
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

export interface MessageCursorPayload {
  createdAt?: string;
  messageId?: string;
}

export interface MessageCursorPagePayload {
  messages?: MessagePayload[] | null;
  nextCursor?: MessageCursorPayload | null;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  attachments: MessageAttachment[];
  status?: string;
  type?: string;
  createdAt: string;
}
