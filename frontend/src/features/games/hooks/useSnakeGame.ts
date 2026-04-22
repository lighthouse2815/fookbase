import { useEffect, useMemo, useRef, useState } from 'react';

import type { User } from '@/features/user/types/contracts';
import { useGameLobby } from './useGameLobby';
import { GAME_HUB_EVENTS } from '@/features/games/types/common';
import type { GameOverEvent, GameStartedEvent, GameStateUpdatedEvent } from '@/features/games/types/common';
import type { SnakeInput, SnakeState } from '@/features/games/types/snake';

interface UseSnakeGameOptions {
  currentUser: User;
  initialRoomCode?: string | null;
}

const isOppositeDirection = (current: SnakeInput['direction'], next: SnakeInput['direction']): boolean => {
  return (
    (current === 'up' && next === 'down')
    || (current === 'down' && next === 'up')
    || (current === 'left' && next === 'right')
    || (current === 'right' && next === 'left')
  );
};

export const useSnakeGame = ({ currentUser, initialRoomCode }: UseSnakeGameOptions) => {
  const lobby = useGameLobby({
    gameType: 'snake-duo',
    currentUser,
    initialRoomCode,
  });

  const { activeRoom, invoke, subscribe } = lobby;
  const [snakeState, setSnakeState] = useState<SnakeState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverEvent<SnakeState> | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const lastInputAtRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribeGameStarted = subscribe<GameStartedEvent<SnakeState>>(GAME_HUB_EVENTS.gameStarted, (event) => {
      if (event.gameType !== 'snake-duo') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setSnakeState(event.state);
      setGameOver(null);
      setInputError(null);
    });

    const unsubscribeGameState = subscribe<GameStateUpdatedEvent<SnakeState>>(GAME_HUB_EVENTS.gameStateUpdated, (event) => {
      if (event.gameType !== 'snake-duo') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setSnakeState(event.state);
    });

    const unsubscribeGameOver = subscribe<GameOverEvent<SnakeState>>(GAME_HUB_EVENTS.gameOver, (event) => {
      if (event.gameType !== 'snake-duo') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setGameOver(event);
      setSnakeState(event.finalState ?? null);
    });

    return () => {
      unsubscribeGameStarted();
      unsubscribeGameState();
      unsubscribeGameOver();
    };
  }, [activeRoom, subscribe]);

  useEffect(() => {
    if (!activeRoom) {
      const resetId = window.setTimeout(() => {
        setSnakeState(null);
        setGameOver(null);
      }, 0);

      return () => {
        window.clearTimeout(resetId);
      };
    }

    void invoke<SnakeState | null>('GetCurrentGameState', activeRoom.roomId)
      .then((state) => {
        setSnakeState(state);
      })
      .catch(() => {
        setSnakeState(null);
      });
  }, [activeRoom, invoke]);

  const myPlayer = useMemo(() => {
    if (!snakeState) {
      return null;
    }

    return snakeState.players.find((player) => player.userId === currentUser.id) ?? null;
  }, [currentUser.id, snakeState]);

  const sendDirection = async (direction: SnakeInput['direction']) => {
    if (!activeRoom || !myPlayer) {
      return false;
    }

    if (!myPlayer.isAlive || snakeState?.phase !== 'playing') {
      return false;
    }

    if (isOppositeDirection(myPlayer.direction, direction)) {
      return false;
    }

    const now = Date.now();
    if (now - lastInputAtRef.current < 40) {
      return false;
    }

    lastInputAtRef.current = now;

    try {
      const accepted = await invoke<boolean>('SubmitSnakeInput', {
        roomId: activeRoom.roomId,
        direction,
      });

      if (!accepted) {
        setInputError('Direction update was rejected.');
      } else {
        setInputError(null);
      }

      return accepted;
    } catch {
      setInputError('Unable to send direction input.');
      return false;
    }
  };

  const canControl = Boolean(
    snakeState
      && snakeState.phase === 'playing'
      && myPlayer
      && myPlayer.isAlive,
  );

  return {
    ...lobby,
    snakeState,
    gameOver,
    setGameOver,
    inputError,
    setInputError,
    sendDirection,
    myPlayer,
    canControl,
  };
};


