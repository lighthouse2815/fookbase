import { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { useFlappyGame } from '@/hooks/games/useFlappyGame';
import { ConnectionStatus } from '@/components/games/shared/ConnectionStatus';
import { CountdownOverlay } from '@/components/games/shared/CountdownOverlay';
import { GameHeader } from '@/components/games/shared/GameHeader';
import { GameLobby } from '@/components/games/shared/GameLobby';
import { GameResultModal } from '@/components/games/shared/GameResultModal';
import { FlappyCanvas } from '@/components/games/flappy/FlappyCanvas';
import { FlappyScoreBoard } from '@/components/games/flappy/FlappyScoreBoard';

export const FlappyDuoPage = () => {
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
    flappyState,
    gameOver,
    setGameOver,
    inputError,
    setInputError,
    flap,
    canControl,
  } = useFlappyGame({
    currentUser,
    initialRoomCode,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || !canControl) {
        return;
      }

      event.preventDefault();
      void flap();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canControl, flap]);

  return (
    <div className="space-y-4">
      <GameHeader
        title="Flappy Duo"
        description="Survive longer than your opponent. Press Space or tap flap."
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

      {activeRoom && flappyState ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            {inputError ? (
              <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                {inputError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canControl}
              onClick={() => {
                void flap();
              }}
              className="mb-3 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
            >
              Flap
            </button>

            <FlappyCanvas state={flappyState} currentUserId={currentUser.id} />
            {flappyState.phase === 'countdown' ? <CountdownOverlay countdown={flappyState.countdown} /> : null}
          </div>
          <FlappyScoreBoard players={flappyState.players} currentUserId={currentUser.id} />
        </section>
      ) : null}

      <GameResultModal
        isOpen={Boolean(gameOver)}
        result={gameOver}
        players={activeRoom?.players ?? []}
        currentUserId={currentUser.id}
        onClose={() => {
          setGameOver(null);
          setInputError(null);
          setActionError(null);
        }}
        onRematch={async () => {
          await requestRematch();
        }}
      />
    </div>
  );
};
