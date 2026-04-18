import type { ChessMoveRecord } from '../../../type/games/chess';

interface MoveHistoryPanelProps {
  moves: ChessMoveRecord[];
}

export const MoveHistoryPanel = ({ moves }: MoveHistoryPanelProps) => {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Move history</h3>
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
        {moves.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No moves yet.</p>
        ) : null}
        {moves.map((move) => (
          <div
            key={`${move.moveNumber}-${move.movedAt}`}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
          >
            <span className="mr-2 font-semibold text-slate-700 dark:text-slate-200">#{move.moveNumber}</span>
            <span className="font-mono text-slate-700 dark:text-slate-200">{move.notation}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};
