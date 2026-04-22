import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';

import { ENV } from '@/shared/env/env';
import type { CreateAuthenticatedHubConnectionInput } from '@/shared/lib/types';
import { storage } from '@/shared/storage/storage';

const normalizeHubPath = (hubPath: string): string => {
  if (!hubPath) {
    return '';
  }

  return hubPath.startsWith('/') ? hubPath : `/${hubPath}`;
};

export const createAuthenticatedHubConnection = ({
  hubPath,
  reconnectDelaysMs,
}: CreateAuthenticatedHubConnectionInput): HubConnection => {
  const baseUrl = ENV.API_BASE_URL.replace(/\/+$/, '');
  const normalizedHubPath = normalizeHubPath(hubPath);

  return new HubConnectionBuilder()
    .withUrl(`${baseUrl}${normalizedHubPath}`, {
      withCredentials: true,
      accessTokenFactory: () => storage.getToken() ?? '',
    })
    .withAutomaticReconnect(reconnectDelaysMs)
    .configureLogging(ENV.IS_DEV ? LogLevel.Warning : LogLevel.Error)
    .build();
};

export const startHubConnection = async (connection: HubConnection): Promise<void> => {
  if (connection.state === HubConnectionState.Connected || connection.state === HubConnectionState.Connecting) {
    return;
  }

  await connection.start();
};
