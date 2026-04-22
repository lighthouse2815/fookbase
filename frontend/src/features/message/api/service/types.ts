import type { ChatMessage } from '@/features/message/types/contracts';

export interface ChatRealtimeHandlers {
  onMessage: (message: ChatMessage) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (message: string) => void;
}
