import { useCallback, useEffect, useRef, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';

import { createGamesHubConnection, startGamesHubConnection } from '../../services/games/gamesHub';
import type { GameConnectionStatus } from '../../type/games/common';

interface UseSignalRGameRoomResult {
  connectionStatus: GameConnectionStatus;
  isConnected: boolean;
  invoke: <TResult>(methodName: string, ...args: unknown[]) => Promise<TResult>;
  subscribe: <TPayload>(eventName: string, handler: (payload: TPayload) => void) => () => void;
  reconnect: () => Promise<void>;
}

export const useSignalRGameRoom = (): UseSignalRGameRoomResult => {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<GameConnectionStatus>('connecting');

  useEffect(() => {
    const connection = createGamesHubConnection();
    connectionRef.current = connection;

    connection.onreconnecting(() => {
      setConnectionStatus('reconnecting');
    });

    connection.onreconnected(() => {
      setConnectionStatus('connected');
      void connection.invoke('JoinLobby').catch(() => undefined);
    });

    connection.onclose(() => {
      setConnectionStatus('disconnected');
    });

    void startGamesHubConnection(connection)
      .then(async () => {
        setConnectionStatus('connected');
        await connection.invoke('JoinLobby');
      })
      .catch(() => {
        setConnectionStatus('disconnected');
      });

    return () => {
      const activeConnection = connectionRef.current;
      connectionRef.current = null;
      if (activeConnection) {
        void activeConnection.stop();
      }
    };
  }, []);

  const invoke = useCallback(async <TResult,>(methodName: string, ...args: unknown[]): Promise<TResult> => {
    const connection = connectionRef.current;
    if (!connection) {
      throw new Error('Realtime connection is not initialized.');
    }

    return connection.invoke<TResult>(methodName, ...args);
  }, []);

  const subscribe = useCallback(<TPayload,>(eventName: string, handler: (payload: TPayload) => void) => {
    const connection = connectionRef.current;
    if (!connection) {
      return () => undefined;
    }

    const callback = (payload: TPayload) => {
      handler(payload);
    };

    connection.on(eventName, callback);
    return () => {
      connection.off(eventName, callback);
    };
  }, []);

  const reconnect = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      await connection.stop();
      await startGamesHubConnection(connection);
      await connection.invoke('JoinLobby');
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    invoke,
    subscribe,
    reconnect,
  };
};
