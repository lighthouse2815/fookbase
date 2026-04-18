import { useMemo, useState } from 'react';
import { Chess, type Move, type Square } from 'chess.js';
import { useOutletContext, useSearchParams } from 'react-router-dom';

import type { MainLayoutOutletContext } from '@/layouts/MainLayout';
import { useChessGame } from '@/hooks/games/useChessGame';
import { ChessBoard } from '@/components/games/chess/ChessBoard';
import { MoveHistoryPanel } from '@/components/games/chess/MoveHistoryPanel';
import { ConnectionStatus } from '@/components/games/shared/ConnectionStatus';
import { GameHeader } from '@/components/games/shared/GameHeader';
import { GameLobby } from '@/components/games/shared/GameLobby';
import { GameResultModal } from '@/components/games/shared/GameResultModal';

const getLegalTargets = (
  fen: string,
  square: string,
): string[] => {
  try {
    const engine = new Chess(fen);
    const moves = engine.moves({ square: square as Square, verbose: true }) as Move[];
    return moves.map((move) => move.to);
  } catch {
    return [];
  }
};

const getPieceColor = (fen: string, square: string): 'w' | 'b' | null => {
  try {
    const engine = new Chess(fen);
    const piece = engine.get(square as Square);
    return piece?.color ?? null;
  } catch {
    return null;
  }
};

export const ChessPage = () => {
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
    chessState,
    gameOver,
    setGameOver,
    moveError,
    setMoveError,
    submitMove,
    resign,
    canMove,
    currentPlayerColor,
  } = useChessGame({
    currentUser,
    initialRoomCode,
  });

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);

  const statusText = useMemo(() => {
    if (!chessState) {
      return 'Create or join a room to begin.';
    }

    if (chessState.isCheckmate) {
      return 'Checkmate';
    }

    if (chessState.isStalemate) {
      return 'Stalemate';
    }

    if (chessState.isFinished) {
      return chessState.endReason ?? 'Game finished';
    }

    if (chessState.isCheck) {
      return 'Check';
    }

    return 'In progress';
  }, [chessState]);

  const handleSquareClick = async (square: string) => {
    if (!chessState || !activeRoom || !canMove || !currentPlayerColor) {
      return;
    }

    const myChessColor = currentPlayerColor === 'white' ? 'w' : 'b';

    if (selectedSquare && legalTargets.includes(square)) {
      const success = await submitMove({
        roomId: activeRoom.roomId,
        from: selectedSquare,
        to: square,
      });

      if (success) {
        setSelectedSquare(null);
        setLegalTargets([]);
      }

      return;
    }

    const clickedPieceColor = getPieceColor(chessState.fen, square);
    if (clickedPieceColor !== myChessColor) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    setSelectedSquare(square);
    setLegalTargets(getLegalTargets(chessState.fen, square));
  };

  return (
    <div className="space-y-4">
      <GameHeader
        title="Chess Online"
        description="Server-validated real-time chess. Invite a friend and play in one room."
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

      {activeRoom && chessState ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{statusText}</p>
              <button
                type="button"
                onClick={() => {
                  void resign();
                }}
                disabled={chessState.isFinished}
                className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/50 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Resign
              </button>
            </div>

            {moveError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                {moveError}
              </p>
            ) : null}

            <ChessBoard
              fen={chessState.fen}
              selectedSquare={selectedSquare}
              legalTargets={legalTargets}
              orientation={currentPlayerColor === 'black' ? 'black' : 'white'}
              onSquareClick={(square) => {
                void handleSquareClick(square);
              }}
              disabled={!canMove}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/80">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Players</h3>
              {activeRoom.players.map((player) => (
                <div key={player.userId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{player.displayName}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {player.userId === chessState.whiteUserId ? 'White' : 'Black'}
                  </span>
                </div>
              ))}
            </div>
            <MoveHistoryPanel moves={chessState.moveHistory} />
          </div>
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
