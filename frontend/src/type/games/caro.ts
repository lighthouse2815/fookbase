export interface CaroMoveRecord {
  turn: number;
  userId: string;
  symbol: 'X' | 'O';
  row: number;
  col: number;
  movedAt: string;
}

export interface CaroState {
  roomId: string;
  boardSize: number;
  xUserId: string;
  oUserId: string;
  currentTurnUserId: string;
  board: (string | null)[][];
  lastMove?: CaroMoveRecord | null;
  moveHistory: CaroMoveRecord[];
  isFinished: boolean;
  winnerUserId?: string | null;
  isDraw: boolean;
  endReason?: string | null;
}

export interface CaroMoveInput {
  roomId: string;
  row: number;
  col: number;
}

