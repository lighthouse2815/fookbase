import type { GameRoom } from '../../../types/games/common';
import { PlayerBadge } from './PlayerBadge';

interface PlayerSlotListProps {
  room: GameRoom;
}

export const PlayerSlotList = ({ room }: PlayerSlotListProps) => {
  const emptySlots = Math.max(0, room.maxPlayers - room.players.length);

  return (
    <div className="space-y-2">
      {room.players.map((player) => (
        <PlayerBadge key={player.userId} player={player} />
      ))}

      {Array.from({ length: emptySlots }).map((_, index) => (
        <div
          key={`empty-slot-${index}`}
          className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
        >
          Waiting for player...
        </div>
      ))}
    </div>
  );
};

