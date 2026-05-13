import { Client } from '@stomp/stompjs';

import { storage } from '@/shared/storage/storage';
import { getJavaApiBaseUrl, toWebSocketUrl } from '@/features/message/utils/realtime.util';

export interface JavaPresenceSocketConnection {
  connect: () => void;
  disconnect: () => void;
}

export const createJavaPresenceSocketConnection = (): JavaPresenceSocketConnection => {
  const client = new Client({
    brokerURL: toWebSocketUrl(getJavaApiBaseUrl()),
    beforeConnect: () => {
      const token = storage.getToken();
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {
      // Keep this silent in UI runtime.
    },
  });

  return {
    connect: () => {
      const token = storage.getToken();
      if (!token) {
        return;
      }

      if (!client.active) {
        client.activate();
      }
    },
    disconnect: () => {
      if (client.active) {
        void client.deactivate();
      }
    },
  };
};

