import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

import { storage } from '../../utils/storage';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7000';
const gamesHubUrl = `${apiBaseUrl.replace(/\/+$/, '')}/hubs/games`;

export const createGamesHubConnection = (): HubConnection => {
  return new HubConnectionBuilder()
    .withUrl(gamesHubUrl, {
      withCredentials: true,
      accessTokenFactory: () => storage.getToken() ?? '',
    })
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 20000])
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();
};

export const startGamesHubConnection = async (connection: HubConnection): Promise<void> => {
  if (connection.state === HubConnectionState.Connected || connection.state === HubConnectionState.Connecting) {
    return;
  }

  await connection.start();
};
