export interface FlappyPlayerState {
  userId: string;
  displayName: string;
  avatarUrl: string;
  x: number;
  y: number;
  velocityY: number;
  score: number;
  isAlive: boolean;
}

export interface FlappyPipe {
  pipeId: number;
  x: number;
  width: number;
  gapY: number;
  gapHeight: number;
}

export interface FlappyState {
  roomId: string;
  phase: 'countdown' | 'playing' | 'finished';
  countdown: number;
  tick: number;
  width: number;
  height: number;
  groundHeight: number;
  players: FlappyPlayerState[];
  pipes: FlappyPipe[];
  winnerUserId?: string | null;
  isDraw: boolean;
  endReason?: string | null;
}

export interface FlappyInput {
  roomId: string;
  action: 'flap';
}
