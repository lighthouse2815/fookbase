interface CaroCellProps {
  value: string | null;
  row: number;
  col: number;
  isLastMove: boolean;
  onClick: (row: number, col: number) => void;
  disabled: boolean;
}

export const CaroCell = ({ value, row, col, isLastMove, onClick, disabled }: CaroCellProps) => {
  return (
    <button
      type="button"
      disabled={disabled || Boolean(value)}
      onClick={() => onClick(row, col)}
      className={`flex h-7 w-7 items-center justify-center border border-slate-300 text-xs font-bold transition dark:border-slate-700 ${
        isLastMove ? 'bg-amber-100 dark:bg-amber-500/25' : 'bg-white dark:bg-slate-900/80'
      } ${
        value === 'X'
          ? 'text-brand-600 dark:text-brand-300'
          : value === 'O'
            ? 'text-rose-600 dark:text-rose-300'
            : 'text-slate-400'
      }`}
    >
      {value ?? ''}
    </button>
  );
};

