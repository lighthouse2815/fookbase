import { javaApiClient } from '@/shared/api/apiClient';
import type {
  ChatMessage,
  ConversationSummary,
  CreateGroupConversationInput,
  MessageCursorPage,
} from '@/features/message/types/contracts';
import type { GetMessagesQueryDto, SendMessageRequestDto } from '@/features/message/api/dtos/request.dto';
import type {
  ConversationResponseDto,
  MessageCursorPageResponseDto,
  MessageResponseDto,
} from '@/features/message/api/dtos/response.dto';
import {
  mapConversationResponseDtoToConversationSummary,
  mapCreateGroupConversationInputToRequestDto,
  mapCreatePrivateConversationInputToRequestDto,
  mapMessageCursorPageResponseDtoToMessageCursorPage,
  mapMessageResponseDtoToChatMessage,
} from '@/features/message/api/mapper/mapper';

const MESSAGE_ENDPOINTS = {
  CONVERSATIONS_BY_USER: '/api/messenger/conversations/getByUser',
  GROUPS_BY_USER: '/api/messenger/conversations/getGroupByUser',
  CONVERSATION_MESSAGES: (conversationId: string) => `/api/messenger/messages/conversation/${conversationId}`,
  SEND_MESSAGE: '/api/messenger/messages/send',
  CREATE_CONVERSATION: '/api/messenger/conversations/create',
} as const;

export const messageService = {
  async getConversationsByUser(): Promise<ConversationSummary[]> {
    const response = await javaApiClient.get<ConversationResponseDto[]>(MESSAGE_ENDPOINTS.CONVERSATIONS_BY_USER);
    return Array.isArray(response.data)
      ? response.data.map(mapConversationResponseDtoToConversationSummary)
      : [];
  },

  async getGroupsByUser(): Promise<ConversationSummary[]> {
    const response = await javaApiClient.get<ConversationResponseDto[]>(MESSAGE_ENDPOINTS.GROUPS_BY_USER);
    return Array.isArray(response.data)
      ? response.data.map(mapConversationResponseDtoToConversationSummary)
      : [];
  },

  async getMessages(conversationId: string, options?: GetMessagesQueryDto): Promise<MessageCursorPage> {
    const response = await javaApiClient.get<MessageCursorPageResponseDto>(
      MESSAGE_ENDPOINTS.CONVERSATION_MESSAGES(conversationId),
      {
        params: {
          cursorCreatedAt: options?.cursorCreatedAt,
          cursorMessageId: options?.cursorMessageId,
          limit: options?.limit ?? 40,
        },
      },
    );

    return mapMessageCursorPageResponseDtoToMessageCursorPage(response.data);
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const payload: SendMessageRequestDto = { conversationId, content };
    const response = await javaApiClient.post<MessageResponseDto>(MESSAGE_ENDPOINTS.SEND_MESSAGE, payload);
    return mapMessageResponseDtoToChatMessage(response.data, 0);
  },

  async createGroupConversation(input: CreateGroupConversationInput): Promise<void> {
    await javaApiClient.post(
      MESSAGE_ENDPOINTS.CREATE_CONVERSATION,
      mapCreateGroupConversationInputToRequestDto(input),
    );
  },

  async createPrivateConversation(currentUserId: string, targetUserId: string): Promise<void> {
    await javaApiClient.post(
      MESSAGE_ENDPOINTS.CREATE_CONVERSATION,
      mapCreatePrivateConversationInputToRequestDto(currentUserId, targetUserId),
    );
  },
};
