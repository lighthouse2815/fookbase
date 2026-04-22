import { ChessPiece } from './ChessPiece';

interface ChessSquareProps {
  square: string;
  piece?: string;
  isLight: boolean;
  isSelected: boolean;
  isLegalTarget: boolean;
  onClick: (square: string) => void;
  disabled: boolean;
}

export const ChessSquare = ({
  square,
  piece,
  isLight,
  isSelected,
  isLegalTarget,
  onClick,
  disabled,
}: ChessSquareProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(square)}
      className={`relative flex aspect-square items-center justify-center transition ${
        isLight ? 'bg-[#f8e7c5]' : 'bg-[#b58863]'
      } ${
        isSelected ? 'ring-2 ring-inset ring-brand-500' : ''
      } ${
        isLegalTarget ? 'after:absolute after:h-3 after:w-3 after:rounded-full after:bg-brand-500/70 after:content-[""]' : ''
      }`}
    >
      {piece ? <ChessPiece piece={piece} /> : null}
    </button>
  );
};

