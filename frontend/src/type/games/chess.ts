export interface ChessMoveRecord {
  moveNumber: number;
  userId: string;
  from: string;
  to: string;
  promotion?: string | null;
  notation: string;
  movedAt: string;
}

export interface ChessState {
  roomId: string;
  fen: string;
  whiteUserId: string;
  blackUserId: string;
  currentTurnUserId: string;
  isCheck: boolean;
  checkedUserId?: string | null;
  isCheckmate: boolean;
  isStalemate: boolean;
  isFinished: boolean;
  winnerUserId?: string | null;
  endReason?: string | null;
  moveHistory: ChessMoveRecord[];
}

export interface ChessMoveInput {
  roomId: string;
  from: string;
  to: string;
  promotion?: string;
}

