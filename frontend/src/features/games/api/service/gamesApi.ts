import { apiClient } from '@/shared/api/apiClient';
import type { ApiEnvelope } from '@/shared/types/api';
import type { GameDefinition, GameRoom, GameType } from '@/features/games/types/common';

const extractData = <T>(response: ApiEnvelope<T>, fallbackError: string): T => {
  if (response.data === undefined) {
    throw new Error(response.error?.message ?? fallbackError);
  }

  return response.data;
};

export interface CreateRoomPayload {
  gameType: GameType;
  maxPlayers?: number;
  displayName?: string;
  avatarUrl?: string;
}

export interface JoinRoomByCodePayload {
  roomCode: string;
  displayName?: string;
  avatarUrl?: string;
}

export const gamesApi = {
  async getGames(): Promise<GameDefinition[]> {
    const response = await apiClient.get<ApiEnvelope<GameDefinition[]>>('/api/games');
    return extractData(response.data, 'Failed to load games list.');
  },

  async getRooms(gameType?: GameType): Promise<GameRoom[]> {
    const response = await apiClient.get<ApiEnvelope<GameRoom[]>>('/api/games/rooms', {
      params: gameType ? { gameType } : undefined,
    });

    return extractData(response.data, 'Failed to load rooms list.');
  },

  async getRoomByCode(roomCode: string): Promise<GameRoom> {
    const response = await apiClient.get<ApiEnvelope<GameRoom>>(`/api/games/rooms/by-code/${encodeURIComponent(roomCode)}`);
    return extractData(response.data, 'Room not found.');
  },

  async getActiveRoom(gameType: GameType): Promise<GameRoom | null> {
    const response = await apiClient.get<ApiEnvelope<GameRoom | null>>('/api/games/rooms/active', {
      params: { gameType },
    });

    return extractData(response.data, 'Failed to load active room.');
  },

  async createRoom(payload: CreateRoomPayload): Promise<GameRoom> {
    const response = await apiClient.post<ApiEnvelope<GameRoom>>('/api/games/rooms', payload);
    return extractData(response.data, 'Failed to create room.');
  },

  async joinRoomByCode(payload: JoinRoomByCodePayload): Promise<GameRoom> {
    const response = await apiClient.post<ApiEnvelope<GameRoom>>('/api/games/rooms/join-by-code', payload);
    return extractData(response.data, 'Failed to join room.');
  },

  async leaveRoom(roomId: string): Promise<GameRoom> {
    const response = await apiClient.post<ApiEnvelope<GameRoom>>('/api/games/rooms/leave', {
      roomId,
    });
    return extractData(response.data, 'Failed to leave room.');
  },
};

