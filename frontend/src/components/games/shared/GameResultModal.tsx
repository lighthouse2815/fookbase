import type { GameOverEvent } from '../../../types/games/common';
import type { GameRoomPlayer } from '../../../types/games/common';

interface GameResultModalProps {
  isOpen: boolean;
  result: GameOverEvent | null;
  players: GameRoomPlayer[];
  currentUserId: string;
  onClose: () => void;
  onRematch: () => Promise<void>;
}

const resolveWinnerLabel = (
  result: GameOverEvent,
  players: GameRoomPlayer[],
  currentUserId: string,
): string => {
  if (result.isDraw) {
    return 'Draw';
  }

  if (!result.winnerUserId) {
    return 'No winner';
  }

  if (result.winnerUserId === currentUserId) {
    return 'You win';
  }

  const winner = players.find((player) => player.userId === result.winnerUserId);
  return winner ? `${winner.displayName} wins` : 'Opponent wins';
};

export const GameResultModal = ({
  isOpen,
  result,
  players,
  currentUserId,
  onClose,
  onRematch,
}: GameResultModalProps) => {
  if (!isOpen || !result) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{resolveWinnerLabel(result, players, currentUserId)}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Reason: <span className="font-medium">{result.reason}</span>
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              void onRematch();
            }}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
          >
            Rematch
          </button>
        </div>
      </div>
    </div>
  );
};

