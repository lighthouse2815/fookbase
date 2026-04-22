import type { CaroMoveRecord } from '@/features/games/types/caro';
import { CaroCell } from './CaroCell';

interface CaroBoardProps {
  board: (string | null)[][];
  lastMove?: CaroMoveRecord | null;
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
}

export const CaroBoard = ({ board, lastMove, onCellClick, disabled }: CaroBoardProps) => {
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/80">
      <div
        className="grid w-max"
        style={{
          gridTemplateColumns: `repeat(${board.length}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <CaroCell
              key={`${rowIndex}-${colIndex}`}
              value={value}
              row={rowIndex}
              col={colIndex}
              isLastMove={lastMove?.row === rowIndex && lastMove?.col === colIndex}
              onClick={onCellClick}
              disabled={disabled}
            />
          )),
        )}
      </div>
    </div>
  );
};

