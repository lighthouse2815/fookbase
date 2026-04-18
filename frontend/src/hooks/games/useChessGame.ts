import { useEffect, useMemo, useState } from 'react';

import { GAME_HUB_EVENTS } from '../../type/games/common';
import type { GameOverEvent, GameStateUpdatedEvent, GameStartedEvent, MoveRejectedEvent } from '../../type/games/common';
import type { ChessMoveInput, ChessState } from '../../type/games/chess';
import type { User } from '../../types/user';
import { useGameLobby } from './useGameLobby';

interface ChessMoveOutcomePayload {
  accepted: boolean;
  error?: string | null;
  state?: ChessState | null;
}

interface UseChessGameOptions {
  currentUser: User;
  initialRoomCode?: string | null;
}

export const useChessGame = ({ currentUser, initialRoomCode }: UseChessGameOptions) => {
  const lobby = useGameLobby({
    gameType: 'chess',
    currentUser,
    initialRoomCode,
  });

  const { activeRoom, invoke, subscribe } = lobby;
  const [chessState, setChessState] = useState<ChessState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverEvent<ChessState> | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeGameStarted = subscribe<GameStartedEvent<ChessState>>(GAME_HUB_EVENTS.gameStarted, (event) => {
      if (event.gameType !== 'chess') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setChessState(event.state);
      setGameOver(null);
      setMoveError(null);
    });

    const unsubscribeGameState = subscribe<GameStateUpdatedEvent<ChessState>>(GAME_HUB_EVENTS.gameStateUpdated, (event) => {
      if (event.gameType !== 'chess') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setChessState(event.state);
    });

    const unsubscribeGameOver = subscribe<GameOverEvent<ChessState>>(GAME_HUB_EVENTS.gameOver, (event) => {
      if (event.gameType !== 'chess') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setGameOver(event);
      setChessState(event.finalState ?? null);
    });

    const unsubscribeMoveRejected = subscribe<MoveRejectedEvent>(GAME_HUB_EVENTS.moveRejected, (event) => {
      if (event.gameType !== 'chess') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setMoveError(event.reason);
    });

    return () => {
      unsubscribeGameStarted();
      unsubscribeGameState();
      unsubscribeGameOver();
      unsubscribeMoveRejected();
    };
  }, [activeRoom, subscribe]);

  useEffect(() => {
    if (!activeRoom) {
      const resetId = window.setTimeout(() => {
        setChessState(null);
        setGameOver(null);
      }, 0);

      return () => {
        window.clearTimeout(resetId);
      };
    }

    void invoke<ChessState | null>('GetCurrentGameState', activeRoom.roomId)
      .then((state) => {
        setChessState(state);
      })
      .catch(() => {
        setChessState(null);
      });
  }, [activeRoom, invoke]);

  const submitMove = async (payload: ChessMoveInput) => {
    const result = await invoke<ChessMoveOutcomePayload>('SubmitChessMove', payload);
    if (!result.accepted) {
      setMoveError(result.error?.trim() || 'Move rejected.');
      return false;
    }

    if (result.state) {
      setChessState(result.state);
    }

    setMoveError(null);
    return true;
  };

  const resign = async () => {
    if (!activeRoom) {
      return;
    }

    const result = await invoke<GameOverEvent<ChessState>>('ResignChess', { roomId: activeRoom.roomId });
    setGameOver(result);
    setChessState(result.finalState ?? chessState);
  };

  const currentPlayerColor = useMemo(() => {
    if (!chessState) {
      return null;
    }

    if (currentUser.id === chessState.whiteUserId) {
      return 'white';
    }

    if (currentUser.id === chessState.blackUserId) {
      return 'black';
    }

    return null;
  }, [chessState, currentUser.id]);

  const canMove = Boolean(
    chessState
      && !chessState.isFinished
      && chessState.currentTurnUserId === currentUser.id,
  );

  return {
    ...lobby,
    chessState,
    gameOver,
    setGameOver,
    moveError,
    setMoveError,
    submitMove,
    resign,
    canMove,
    currentPlayerColor,
  };
};
