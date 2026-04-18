import type { ChatMessage } from '@/interface/message';

export interface ChatRealtimeHandlers {
  onMessage: (message: ChatMessage) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (message: string) => void;
}
