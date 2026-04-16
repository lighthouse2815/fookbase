import { useMemo } from 'react';

import { ChessSquare } from './ChessSquare';

interface ChessBoardProps {
  fen: string;
  selectedSquare: string | null;
  legalTargets: string[];
  orientation: 'white' | 'black';
  onSquareClick: (square: string) => void;
  disabled: boolean;
}

interface ParsedSquare {
  square: string;
  piece?: string;
  isLight: boolean;
}

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

const parseFenBoard = (fen: string): (string | null)[][] => {
  const [placement] = fen.split(' ');
  const rows = placement.split('/');

  return rows.map((row) => {
    const cells: (string | null)[] = [];
    for (const token of row) {
      if (/\d/.test(token)) {
        const emptyCount = Number(token);
        for (let index = 0; index < emptyCount; index += 1) {
          cells.push(null);
        }
        continue;
      }

      cells.push(token);
    }

    return cells;
  });
};

export const ChessBoard = ({
  fen,
  selectedSquare,
  legalTargets,
  orientation,
  onSquareClick,
  disabled,
}: ChessBoardProps) => {
  const boardCells = useMemo<ParsedSquare[]>(() => {
    const board = parseFenBoard(fen);
    const orientedFiles = orientation === 'white' ? files : [...files].reverse();
    const orientedRanks = orientation === 'white' ? ranks : [...ranks].reverse();

    const squares: ParsedSquare[] = [];

    orientedRanks.forEach((rank, rowIndex) => {
      orientedFiles.forEach((file, colIndex) => {
        const sourceRow = orientation === 'white' ? rowIndex : 7 - rowIndex;
        const sourceCol = orientation === 'white' ? colIndex : 7 - colIndex;
        const piece = board[sourceRow]?.[sourceCol] ?? null;
        const square = `${file}${rank}`;
        const boardRow = Number(rank);
        const boardCol = file.charCodeAt(0) - 96;
        const isLight = (boardRow + boardCol) % 2 === 1;

        squares.push({
          square,
          piece: piece ?? undefined,
          isLight,
        });
      });
    });

    return squares;
  }, [fen, orientation]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 shadow-card dark:border-slate-700">
      <div className="grid grid-cols-8">
        {boardCells.map((cell) => (
          <ChessSquare
            key={cell.square}
            square={cell.square}
            piece={cell.piece}
            isLight={cell.isLight}
            isSelected={selectedSquare === cell.square}
            isLegalTarget={legalTargets.includes(cell.square)}
            onClick={onSquareClick}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

