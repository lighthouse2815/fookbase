import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { gamesApi } from '../../services/games/gamesApi';
import { useSignalRGameRoom } from './useSignalRGameRoom';
import type {
  GameRoom,
  GameStartedEvent,
  GameType,
  RematchRequestedEvent,
  PlayerPresenceChangedEvent,
  GameRoomStatus,
} from '../../type/games/common';
import { GAME_HUB_EVENTS } from '../../type/games/common';
import type { User } from '@/interface/user';

interface UseGameLobbyOptions {
  gameType: GameType;
  currentUser: User;
  initialRoomCode?: string | null;
}

interface UseGameLobbyResult {
  connectionStatus: ReturnType<typeof useSignalRGameRoom>['connectionStatus'];
  invoke: ReturnType<typeof useSignalRGameRoom>['invoke'];
  subscribe: ReturnType<typeof useSignalRGameRoom>['subscribe'];
  rooms: GameRoom[];
  activeRoom: GameRoom | null;
  isLoading: boolean;
  actionError: string | null;
  setActionError: (message: string | null) => void;
  refreshRooms: () => Promise<void>;
  createRoom: () => Promise<GameRoom>;
  joinRoomByCode: (roomCode: string) => Promise<GameRoom>;
  joinRoom: (roomId: string) => Promise<GameRoom>;
  leaveRoom: (roomId?: string) => Promise<void>;
  startGame: (roomId?: string) => Promise<GameStartedEvent<unknown>>;
  requestRematch: (roomId?: string) => Promise<GameStartedEvent<unknown> | null>;
  acceptRematch: (roomId?: string) => Promise<GameStartedEvent<unknown> | null>;
}

const normalizeApiError = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: string }).message?.trim();
    if (message) {
      return message;
    }
  }

  return fallback;
};

const updateRoomsCollection = (existing: GameRoom[], incoming: GameRoom): GameRoom[] => {
  const filtered = existing.filter((room) => room.roomId !== incoming.roomId);
  if (incoming.isDeleted) {
    return filtered;
  }

  return [incoming, ...filtered].sort(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
};

const shouldAllowStart = (status: GameRoomStatus): boolean => status === 'waiting' || status === 'finished';

export const useGameLobby = ({
  gameType,
  currentUser,
  initialRoomCode,
}: UseGameLobbyOptions): UseGameLobbyResult => {
  const { connectionStatus, invoke, subscribe } = useSignalRGameRoom();

  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const autoJoinTriggeredRef = useRef(false);

  const profilePayload = useMemo(
    () => ({
      displayName: currentUser.fullName,
      avatarUrl: currentUser.avatarUrl,
    }),
    [currentUser.avatarUrl, currentUser.fullName],
  );

  const refreshRooms = useCallback(async () => {
    const list = await gamesApi.getRooms(gameType);
    setRooms(list.filter((room) => !room.isDeleted));
  }, [gameType]);

  const syncActiveRoomFromApi = useCallback(async () => {
    const room = await gamesApi.getActiveRoom(gameType);
    if (!room || room.isDeleted) {
      setActiveRoom(null);
      return null;
    }

    setActiveRoom(room);
    return room;
  }, [gameType]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setIsLoading(true);
      setActionError(null);

      try {
        const [nextRooms, activeRoomFromApi] = await Promise.all([
          gamesApi.getRooms(gameType),
          gamesApi.getActiveRoom(gameType),
        ]);

        if (!active) {
          return;
        }

        setRooms(nextRooms.filter((room) => !room.isDeleted));
        setActiveRoom(activeRoomFromApi && !activeRoomFromApi.isDeleted ? activeRoomFromApi : null);
      } catch (error) {
        if (!active) {
          return;
        }

        setActionError(normalizeApiError(error, 'Unable to load lobby.'));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [gameType]);

  useEffect(() => {
    const unsubscribeCreated = subscribe<GameRoom>(GAME_HUB_EVENTS.roomCreated, (room) => {
      if (room.gameType !== gameType) {
        return;
      }

      setRooms((existing) => updateRoomsCollection(existing, room));
    });

    const unsubscribeUpdated = subscribe<GameRoom>(GAME_HUB_EVENTS.roomUpdated, (room) => {
      if (room.gameType !== gameType) {
        return;
      }

      setRooms((existing) => updateRoomsCollection(existing, room));
      setActiveRoom((existing) => {
        if (!existing || existing.roomId !== room.roomId) {
          return existing;
        }

        return room.isDeleted ? null : room;
      });
    });

    const unsubscribePlayerJoined = subscribe<PlayerPresenceChangedEvent>(GAME_HUB_EVENTS.playerJoined, (event) => {
      setActiveRoom((existing) => {
        if (!existing || existing.roomId !== event.roomId) {
          return existing;
        }

        return existing;
      });
    });

    const unsubscribePlayerLeft = subscribe<PlayerPresenceChangedEvent>(GAME_HUB_EVENTS.playerLeft, (event) => {
      setActiveRoom((existing) => {
        if (!existing || existing.roomId !== event.roomId) {
          return existing;
        }

        return existing;
      });
    });

    const unsubscribeRematchRequested = subscribe<RematchRequestedEvent>(
      GAME_HUB_EVENTS.rematchRequested,
      (event) => {
        if (activeRoom && event.roomId === activeRoom.roomId) {
          setActionError(null);
        }
      },
    );

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
      unsubscribeRematchRequested();
    };
  }, [activeRoom, gameType, subscribe]);

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      return;
    }

    if (!activeRoom) {
      return;
    }

    void invoke<GameRoom>('JoinRoomGroup', activeRoom.roomId)
      .then((room) => {
        setActiveRoom(room);
      })
      .catch(() => undefined);
  }, [activeRoom, connectionStatus, invoke]);

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      return;
    }

    if (!initialRoomCode || autoJoinTriggeredRef.current) {
      return;
    }

    if (activeRoom) {
      autoJoinTriggeredRef.current = true;
      return;
    }

    autoJoinTriggeredRef.current = true;

    void invoke<GameRoom>('JoinRoomByCode', {
      roomCode: initialRoomCode,
      ...profilePayload,
    })
      .then((room) => {
        setActiveRoom(room);
        setRooms((existing) => updateRoomsCollection(existing, room));
      })
      .catch((error) => {
        setActionError(normalizeApiError(error, 'Unable to join room by code.'));
      });
  }, [activeRoom, connectionStatus, initialRoomCode, invoke, profilePayload]);

  const createRoom = useCallback(async (): Promise<GameRoom> => {
    try {
      const room = await invoke<GameRoom>('CreateRoom', {
        gameType,
        maxPlayers: 2,
        ...profilePayload,
      });

      setActiveRoom(room);
      setRooms((existing) => updateRoomsCollection(existing, room));
      setActionError(null);
      return room;
    } catch (error) {
      const message = normalizeApiError(error, 'Unable to create room.');
      setActionError(message);
      throw new Error(message);
    }
  }, [gameType, invoke, profilePayload]);

  const joinRoomByCode = useCallback(async (roomCode: string): Promise<GameRoom> => {
    try {
      const room = await invoke<GameRoom>('JoinRoomByCode', {
        roomCode,
        ...profilePayload,
      });

      setActiveRoom(room);
      setRooms((existing) => updateRoomsCollection(existing, room));
      setActionError(null);
      return room;
    } catch (error) {
      const message = normalizeApiError(error, 'Unable to join room.');
      setActionError(message);
      throw new Error(message);
    }
  }, [invoke, profilePayload]);

  const joinRoom = useCallback(async (roomId: string): Promise<GameRoom> => {
    try {
      const room = await invoke<GameRoom>('JoinRoom', {
        roomId,
        ...profilePayload,
      });

      setActiveRoom(room);
      setRooms((existing) => updateRoomsCollection(existing, room));
      setActionError(null);
      return room;
    } catch (error) {
      const message = normalizeApiError(error, 'Unable to join room.');
      setActionError(message);
      throw new Error(message);
    }
  }, [invoke, profilePayload]);

  const leaveRoom = useCallback(async (roomId?: string) => {
    const targetRoomId = roomId ?? activeRoom?.roomId;
    if (!targetRoomId) {
      return;
    }

    try {
      const updated = await invoke<GameRoom>('LeaveRoom', { roomId: targetRoomId });
      setRooms((existing) => updateRoomsCollection(existing, updated));
      setActiveRoom((existing) => (existing?.roomId === targetRoomId ? null : existing));
      setActionError(null);
    } catch (error) {
      const message = normalizeApiError(error, 'Unable to leave room.');
      setActionError(message);
      throw new Error(message);
    }
  }, [activeRoom?.roomId, invoke]);

  const startGame = useCallback(async (roomId?: string): Promise<GameStartedEvent<unknown>> => {
    const targetRoomId = roomId ?? activeRoom?.roomId;
    if (!targetRoomId) {
      throw new Error('Room is required to start game.');
    }

    if (activeRoom && !shouldAllowStart(activeRoom.status)) {
      throw new Error('Game already started.');
    }

    try {
      const started = await invoke<GameStartedEvent<unknown>>('StartGame', {
        roomId: targetRoomId,
      });
      setActionError(null);
      return started;
    } catch (error) {
      const message = normalizeApiError(error, 'Unable to start game.');
      setActionError(message);
      throw new Error(message);
    }
  }, [activeRoom, invoke]);

  const requestRematch = useCallback(async (roomId?: string): Promise<GameStartedEvent<unknown> | null> => {
    const targetRoomId = roomId ?? activeRoom?.roomId;
    if (!targetRoomId) {
      throw new Error('Room is required for rematch.');
    }

    try {
      const result = await invoke<GameStartedEvent<unknown> | null>('RequestRematch', {
        roomId: targetRoomId,
      });
      setActionError(null);
      return result;
    } catch (error) {
      const message = normalizeApiError(error, 'Unable to request rematch.');
      setActionError(message);
      throw new Error(message);
    }
  }, [activeRoom?.roomId, invoke]);

  const acceptRematch = useCallback(async (roomId?: string): Promise<GameStartedEvent<unknown> | null> => {
    const targetRoomId = roomId ?? activeRoom?.roomId;
    if (!targetRoomId) {
      throw new Error('Room is required for rematch.');
    }

    try {
      const result = await invoke<GameStartedEvent<unknown> | null>('AcceptRematch', {
        roomId: targetRoomId,
      });
      setActionError(null);
      return result;
    } catch (error) {
      const message = normalizeApiError(error, 'Unable to accept rematch.');
      setActionError(message);
      throw new Error(message);
    }
  }, [activeRoom?.roomId, invoke]);

  useEffect(() => {
    if (connectionStatus !== 'connected') {
      return;
    }

    void refreshRooms();
    void syncActiveRoomFromApi();
  }, [connectionStatus, refreshRooms, syncActiveRoomFromApi]);

  return {
    connectionStatus,
    invoke,
    subscribe,
    rooms,
    activeRoom,
    isLoading,
    actionError,
    setActionError,
    refreshRooms,
    createRoom,
    joinRoomByCode,
    joinRoom,
    leaveRoom,
    startGame,
    requestRematch,
    acceptRematch,
  };
};
