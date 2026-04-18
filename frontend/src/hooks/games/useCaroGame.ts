import { useEffect, useMemo, useState } from 'react';

import type { User } from '@/interface/user';
import { useGameLobby } from './useGameLobby';
import { GAME_HUB_EVENTS } from '../../type/games/common';
import type {
  GameOverEvent,
  GameStartedEvent,
  GameStateUpdatedEvent,
  MoveRejectedEvent,
} from '../../type/games/common';
import type { CaroMoveInput, CaroState } from '../../type/games/caro';

interface CaroMoveOutcomePayload {
  accepted: boolean;
  error?: string | null;
  state?: CaroState | null;
}

interface UseCaroGameOptions {
  currentUser: User;
  initialRoomCode?: string | null;
}

export const useCaroGame = ({ currentUser, initialRoomCode }: UseCaroGameOptions) => {
  const lobby = useGameLobby({
    gameType: 'caro',
    currentUser,
    initialRoomCode,
  });

  const { activeRoom, invoke, subscribe } = lobby;
  const [caroState, setCaroState] = useState<CaroState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverEvent<CaroState> | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeGameStarted = subscribe<GameStartedEvent<CaroState>>(GAME_HUB_EVENTS.gameStarted, (event) => {
      if (event.gameType !== 'caro') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setCaroState(event.state);
      setGameOver(null);
      setMoveError(null);
    });

    const unsubscribeGameState = subscribe<GameStateUpdatedEvent<CaroState>>(GAME_HUB_EVENTS.gameStateUpdated, (event) => {
      if (event.gameType !== 'caro') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setCaroState(event.state);
    });

    const unsubscribeGameOver = subscribe<GameOverEvent<CaroState>>(GAME_HUB_EVENTS.gameOver, (event) => {
      if (event.gameType !== 'caro') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setGameOver(event);
      setCaroState(event.finalState ?? null);
    });

    const unsubscribeMoveRejected = subscribe<MoveRejectedEvent>(GAME_HUB_EVENTS.moveRejected, (event) => {
      if (event.gameType !== 'caro') {
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
        setCaroState(null);
        setGameOver(null);
      }, 0);

      return () => {
        window.clearTimeout(resetId);
      };
    }

    void invoke<CaroState | null>('GetCurrentGameState', activeRoom.roomId)
      .then((state) => {
        setCaroState(state);
      })
      .catch(() => {
        setCaroState(null);
      });
  }, [activeRoom, invoke]);

  const submitMove = async (payload: CaroMoveInput) => {
    const result = await invoke<CaroMoveOutcomePayload>('SubmitCaroMove', payload);
    if (!result.accepted) {
      setMoveError(result.error?.trim() || 'Move rejected.');
      return false;
    }

    if (result.state) {
      setCaroState(result.state);
    }

    setMoveError(null);
    return true;
  };

  const canMove = Boolean(
    caroState
      && !caroState.isFinished
      && caroState.currentTurnUserId === currentUser.id,
  );

  const currentSymbol = useMemo(() => {
    if (!caroState) {
      return null;
    }

    if (currentUser.id === caroState.xUserId) {
      return 'X';
    }

    if (currentUser.id === caroState.oUserId) {
      return 'O';
    }

    return null;
  }, [caroState, currentUser.id]);

  return {
    ...lobby,
    caroState,
    gameOver,
    setGameOver,
    moveError,
    setMoveError,
    submitMove,
    canMove,
    currentSymbol,
  };
};
