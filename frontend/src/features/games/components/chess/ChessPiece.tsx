interface ChessPieceProps {
  piece: string;
}

const unicodeByPiece: Record<string, string> = {
  p: '♟',
  r: '♜',
  n: '♞',
  b: '♝',
  q: '♛',
  k: '♚',
  P: '♙',
  R: '♖',
  N: '♘',
  B: '♗',
  Q: '♕',
  K: '♔',
};

export const ChessPiece = ({ piece }: ChessPieceProps) => {
  return (
    <span className="select-none text-2xl leading-none sm:text-3xl">
      {unicodeByPiece[piece] ?? ''}
    </span>
  );
};

