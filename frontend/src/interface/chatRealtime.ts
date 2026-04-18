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
