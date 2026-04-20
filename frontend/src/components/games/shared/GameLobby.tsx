import { useMemo, useState } from 'react';

import type { GameRoom } from '../../../type/games/common';
import { CreateRoomModal } from './CreateRoomModal';
import { JoinRoomForm } from './JoinRoomForm';
import { PlayerSlotList } from './PlayerSlotList';
import { RoomList } from './RoomList';
import { StartGameButton } from './StartGameButton';

interface GameLobbyProps {
  rooms: GameRoom[];
  activeRoom: GameRoom | null;
  currentUserId: string;
  onCreateRoom: () => Promise<void>;
  onJoinRoomByCode: (roomCode: string) => Promise<void>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onStartGame: () => Promise<void>;
}

export const GameLobby = ({
  rooms,
  activeRoom,
  currentUserId,
  onCreateRoom,
  onJoinRoomByCode,
  onJoinRoom,
  onLeaveRoom,
  onStartGame,
}: GameLobbyProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isHost = useMemo(
    () => activeRoom?.hostUserId === currentUserId,
    [activeRoom?.hostUserId, currentUserId],
  );

  const canStart = Boolean(
    activeRoom
      && activeRoom.players.length === activeRoom.maxPlayers
      && activeRoom.status !== 'playing'
      && isHost,
  );

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Lobby</h2>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 sm:w-auto"
        >
          Create room
        </button>
      </div>

      <JoinRoomForm onJoin={(roomCode) => onJoinRoomByCode(roomCode)} />
      <RoomList rooms={rooms} currentRoomId={activeRoom?.roomId} onJoinRoom={(roomId) => void onJoinRoom(roomId)} />

      {activeRoom ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Active room: <span className="font-mono">{activeRoom.roomCode}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activeRoom.status.toUpperCase()}</p>
          </div>

          <PlayerSlotList room={activeRoom} />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                void onLeaveRoom();
              }}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
            >
              Leave room
            </button>
            <StartGameButton disabled={!canStart} onStart={() => onStartGame()} />
          </div>
        </div>
      ) : null}

      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={async () => {
          await onCreateRoom();
          setIsCreateOpen(false);
        }}
      />
    </section>
  );
};

