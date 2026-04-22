import { HubConnection } from '@microsoft/signalr';

import { createAuthenticatedHubConnection, startHubConnection } from '@/shared/lib/signalr';

export const createGamesHubConnection = (): HubConnection => {
  return createAuthenticatedHubConnection({
    hubPath: '/hubs/games',
    reconnectDelaysMs: [0, 1000, 2000, 5000, 10000, 20000],
  });
};

export const startGamesHubConnection = async (connection: HubConnection): Promise<void> => {
  await startHubConnection(connection);
};
