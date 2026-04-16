import type { GameRoomPlayer } from '../../../types/games/common';

interface PlayerBadgeProps {
  player: GameRoomPlayer;
}

export const PlayerBadge = ({ player }: PlayerBadgeProps) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
      <img src={player.avatarUrl} alt={player.displayName} className="h-9 w-9 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{player.displayName}</p>
        <p className={`text-xs ${player.isConnected ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
          {player.isConnected ? 'Online' : 'Offline'}
        </p>
      </div>
      {player.isHost ? (
        <span className="rounded-full bg-brand-100 px-2 py-1 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          Host
        </span>
      ) : null}
    </div>
  );
};

