import { useSearchParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

import type { MainLayoutOutletContext } from '@/shared/types/layout';
import { useCaroGame } from '@/features/games/hooks/useCaroGame';
import { CaroBoard } from '@/features/games/components/caro/CaroBoard';
import { ConnectionStatus } from '@/features/games/components/shared/ConnectionStatus';
import { GameHeader } from '@/features/games/components/shared/GameHeader';
import { GameLobby } from '@/features/games/components/GameLobby';
import { GameResultModal } from '@/features/games/components/shared/GameResultModal';

export const CaroPage = () => {
  const [searchParams] = useSearchParams();
  const initialRoomCode = searchParams.get('code');
  const { currentUser } = useOutletContext<MainLayoutOutletContext>();

  const {
    connectionStatus,
    rooms,
    activeRoom,
    actionError,
    setActionError,
    createRoom,
    joinRoomByCode,
    joinRoom,
    leaveRoom,
    startGame,
    requestRematch,
    caroState,
    gameOver,
    setGameOver,
    moveError,
    setMoveError,
    submitMove,
    canMove,
    currentSymbol,
  } = useCaroGame({
    currentUser,
    initialRoomCode,
  });

  return (
    <div className="space-y-4">
      <GameHeader
        title="Caro Online"
        description="Five-in-a-row duel on a realtime synchronized board."
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ConnectionStatus status={connectionStatus} />
        {activeRoom ? (
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Room code: <span className="font-mono">{activeRoom.roomCode}</span>
          </p>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {actionError}
        </p>
      ) : null}

      {!activeRoom || activeRoom.status === 'waiting' ? (
        <GameLobby
          rooms={rooms}
          activeRoom={activeRoom}
          currentUserId={currentUser.id}
          onCreateRoom={async () => {
            await createRoom();
          }}
          onJoinRoomByCode={async (roomCode) => {
            await joinRoomByCode(roomCode);
          }}
          onJoinRoom={async (roomId) => {
            await joinRoom(roomId);
          }}
          onLeaveRoom={async () => {
            await leaveRoom();
          }}
          onStartGame={async () => {
            await startGame();
          }}
        />
      ) : null}

      {activeRoom && caroState ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {caroState.isFinished
                ? `Game finished: ${caroState.endReason ?? 'done'}`
                : caroState.currentTurnUserId === currentUser.id
                  ? `Your turn (${currentSymbol ?? '-'})`
                  : 'Opponent turn'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {caroState.moveHistory.length} moves
            </p>
          </div>

          {moveError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {moveError}
            </p>
          ) : null}

          <CaroBoard
            board={caroState.board}
            lastMove={caroState.lastMove}
            onCellClick={(row, col) => {
              void submitMove({
                roomId: caroState.roomId,
                row,
                col,
              });
            }}
            disabled={!canMove}
          />
        </section>
      ) : null}

      <GameResultModal
        isOpen={Boolean(gameOver)}
        result={gameOver}
        players={activeRoom?.players ?? []}
        currentUserId={currentUser.id}
        onClose={() => {
          setGameOver(null);
          setMoveError(null);
          setActionError(null);
        }}
        onRematch={async () => {
          await requestRematch();
        }}
      />
    </div>
  );
};



