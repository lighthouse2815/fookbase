import type { FlappyPlayerState } from '../../../types/games/flappy';

interface FlappyScoreBoardProps {
  players: FlappyPlayerState[];
  currentUserId: string;
}

export const FlappyScoreBoard = ({ players, currentUserId }: FlappyScoreBoardProps) => {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Match scores</h3>
      {players.map((player) => {
        const isCurrentPlayer = player.userId === currentUserId;
        return (
          <div
            key={player.userId}
            className={`rounded-xl border px-3 py-2 text-sm ${
              isCurrentPlayer
                ? 'border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {isCurrentPlayer ? 'You' : `${player.displayName} (ghost)`}
              </p>
              <span className={`text-xs font-semibold ${player.isAlive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                {player.isAlive ? 'Alive' : 'Dead'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Score: {player.score}</p>
          </div>
        );
      })}
    </div>
  );
};
