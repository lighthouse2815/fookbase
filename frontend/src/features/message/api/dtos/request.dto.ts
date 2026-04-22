export interface GetMessagesQueryDto {
  cursorCreatedAt?: string;
  cursorMessageId?: string;
  limit?: number;
}

export interface SendMessageRequestDto {
  conversationId: string;
  content: string;
}

export interface ConversationMemberRequestDto {
  userId: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface CreateConversationRequestDto {
  type: 'GROUP' | 'PRIVATE';
  name?: string;
  members: ConversationMemberRequestDto[];
}
