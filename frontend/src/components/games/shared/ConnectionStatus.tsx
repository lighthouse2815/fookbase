import type { GameConnectionStatus } from '../../../types/games/common';

interface ConnectionStatusProps {
  status: GameConnectionStatus;
}

const statusLabel: Record<GameConnectionStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
};

const statusClassName: Record<GameConnectionStatus, string> = {
  connecting: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  connected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  reconnecting: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  disconnected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
};

export const ConnectionStatus = ({ status }: ConnectionStatusProps) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold dark:border-slate-700">
      <span className={`h-2 w-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <span className={`rounded-full px-2 py-0.5 ${statusClassName[status]}`}>{statusLabel[status]}</span>
    </div>
  );
};

