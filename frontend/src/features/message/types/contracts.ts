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

export interface SendRealtimeMessageInput {
  conversationId: string;
  content: string;
}

export interface ChatRealtimeConnection {
  connect: () => void;
  disconnect: () => void;
  subscribeConversation: (conversationId: string) => void;
  unsubscribeConversation: (conversationId: string) => void;
  sendMessage: (input: SendRealtimeMessageInput) => void;
  isConnected: () => boolean;
}
