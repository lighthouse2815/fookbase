import type { SnakePlayerState } from '@/features/games/types/snake';

interface SnakeScoreBoardProps {
  players: SnakePlayerState[];
}

export const SnakeScoreBoard = ({ players }: SnakeScoreBoardProps) => {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Score board</h3>
      {players.map((player) => (
        <div
          key={player.userId}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{player.displayName}</p>
            <span className={`text-xs font-semibold ${player.isAlive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
              {player.isAlive ? 'Alive' : 'Out'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Score: {player.score} • Length: {player.length}
          </p>
        </div>
      ))}
    </div>
  );
};

