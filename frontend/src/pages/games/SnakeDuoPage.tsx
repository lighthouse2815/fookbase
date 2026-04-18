import { useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { useSnakeGame } from '@/hooks/games/useSnakeGame';
import { ConnectionStatus } from '@/components/games/shared/ConnectionStatus';
import { CountdownOverlay } from '@/components/games/shared/CountdownOverlay';
import { GameHeader } from '@/components/games/shared/GameHeader';
import { GameLobby } from '@/components/games/shared/GameLobby';
import { GameResultModal } from '@/components/games/shared/GameResultModal';
import { SnakeCanvas } from '@/components/games/snake/SnakeCanvas';
import { SnakeScoreBoard } from '@/components/games/snake/SnakeScoreBoard';

const keyToDirection: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

export const SnakeDuoPage = () => {
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
    snakeState,
    gameOver,
    setGameOver,
    inputError,
    setInputError,
    sendDirection,
    canControl,
  } = useSnakeGame({
    currentUser,
    initialRoomCode,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = keyToDirection[event.code];
      if (!direction || !canControl) {
        return;
      }

      event.preventDefault();
      void sendDirection(direction);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canControl, sendDirection]);

  return (
    <div className="space-y-4">
      <GameHeader
        title="Snake Duo"
        description="Two snakes, one map, server-authoritative tick loop. Use arrows or WASD."
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

      {activeRoom && snakeState ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            {inputError ? (
              <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                {inputError}
              </p>
            ) : null}

            <SnakeCanvas state={snakeState} />
            {snakeState.phase === 'countdown' ? <CountdownOverlay countdown={snakeState.countdown} /> : null}
          </div>
          <SnakeScoreBoard players={snakeState.players} />
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
