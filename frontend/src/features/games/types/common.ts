export type GameType = 'chess' | 'caro' | 'snake-duo' | 'flappy-duo';

export type GameRoomStatus = 'waiting' | 'playing' | 'finished';

export type GameConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface GameDefinition {
  gameType: GameType;
  name: string;
  description: string;
  routePath: string;
  maxPlayers: number;
}

export interface GameRoomPlayer {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isHost: boolean;
  isConnected: boolean;
  joinedAt: string;
}

export interface GameRoom {
  roomId: string;
  roomCode: string;
  gameType: GameType;
  hostUserId: string;
  maxPlayers: number;
  status: GameRoomStatus;
  createdAt: string;
  isDeleted: boolean;
  players: GameRoomPlayer[];
}

export interface GameStateUpdatedEvent<TState> {
  roomId: string;
  gameType: GameType;
  state: TState;
}

export interface GameStartedEvent<TState> {
  roomId: string;
  gameType: GameType;
  state: TState;
  startedAt: string;
}

export interface GameOverEvent<TState = unknown> {
  roomId: string;
  gameType: GameType;
  winnerUserId?: string | null;
  isDraw: boolean;
  reason: string;
  finalState?: TState;
}

export interface MoveRejectedEvent {
  roomId: string;
  gameType: GameType;
  reason: string;
}

export interface PlayerPresenceChangedEvent {
  roomId: string;
  userId: string;
  displayName: string;
  isConnected: boolean;
  isDisconnectedEvent: boolean;
}

export const GAME_HUB_EVENTS = {
  roomCreated: 'RoomCreated',
  roomUpdated: 'RoomUpdated',
  playerJoined: 'PlayerJoined',
  playerLeft: 'PlayerLeft',
  gameStarted: 'GameStarted',
  gameStateUpdated: 'GameStateUpdated',
  moveAccepted: 'MoveAccepted',
  moveRejected: 'MoveRejected',
  gameOver: 'GameOver',
  rematchRequested: 'RematchRequested',
  rematchAccepted: 'RematchAccepted',
} as const;

export interface RematchRequestedEvent {
  roomId: string;
  userId: string;
}
