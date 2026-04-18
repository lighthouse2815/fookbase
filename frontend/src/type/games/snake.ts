export interface GridPoint {
  x: number;
  y: number;
}

export interface SnakePlayerState {
  userId: string;
  displayName: string;
  avatarUrl: string;
  color: string;
  direction: 'up' | 'down' | 'left' | 'right';
  segments: GridPoint[];
  score: number;
  length: number;
  isAlive: boolean;
}

export interface SnakeState {
  roomId: string;
  phase: 'countdown' | 'playing' | 'finished';
  countdown: number;
  tick: number;
  width: number;
  height: number;
  isWallFatal: boolean;
  fruit: GridPoint;
  players: SnakePlayerState[];
  winnerUserId?: string | null;
  isDraw: boolean;
  endReason?: string | null;
}

export interface SnakeInput {
  roomId: string;
  direction: 'up' | 'down' | 'left' | 'right';
}

