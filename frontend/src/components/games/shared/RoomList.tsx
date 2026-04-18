import type { GameRoom } from '../../../type/games/common';

interface RoomListProps {
  rooms: GameRoom[];
  currentRoomId?: string | null;
  onJoinRoom: (roomId: string) => void;
}

export const RoomList = ({ rooms, currentRoomId, onJoinRoom }: RoomListProps) => {
  if (rooms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No open rooms right now.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rooms.map((room) => {
        const isCurrent = room.roomId === currentRoomId;

        return (
          <div
            key={room.roomId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Room <span className="font-mono">{room.roomCode}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {room.players.length}/{room.maxPlayers} players • {room.status}
              </p>
            </div>

            <button
              type="button"
              disabled={isCurrent || room.status === 'playing' || room.players.length >= room.maxPlayers}
              onClick={() => onJoinRoom(room.roomId)}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
            >
              {isCurrent ? 'Joined' : 'Join'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

