import { HubConnection } from '@microsoft/signalr';

import type { PresenceRealtimeHandlers } from '@/features/user/types/realtime';
import { createAuthenticatedHubConnection, startHubConnection } from '@/shared/lib/signalr';

export const createPresenceRealtimeConnection = (handlers: PresenceRealtimeHandlers): HubConnection => {
  const connection = createAuthenticatedHubConnection({
    hubPath: '/hubs/presence',
    reconnectDelaysMs: [0, 2000, 5000, 10000, 20000],
  });

  connection.on('PresenceChanged', handlers.onPresenceChanged);
  return connection;
};

export const startPresenceRealtimeConnection = async (connection: HubConnection): Promise<void> => {
  await startHubConnection(connection);
};

