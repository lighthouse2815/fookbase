import { useEffect, useMemo, useRef, useState } from 'react';

import type { User } from '../../types/user';
import { useGameLobby } from './useGameLobby';
import { GAME_HUB_EVENTS } from '../../type/games/common';
import type { GameOverEvent, GameStartedEvent, GameStateUpdatedEvent } from '../../type/games/common';
import type { FlappyState } from '../../type/games/flappy';

interface UseFlappyGameOptions {
  currentUser: User;
  initialRoomCode?: string | null;
}

export const useFlappyGame = ({ currentUser, initialRoomCode }: UseFlappyGameOptions) => {
  const lobby = useGameLobby({
    gameType: 'flappy-duo',
    currentUser,
    initialRoomCode,
  });

  const { activeRoom, invoke, subscribe } = lobby;
  const [flappyState, setFlappyState] = useState<FlappyState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverEvent<FlappyState> | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const lastFlapAtRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribeGameStarted = subscribe<GameStartedEvent<FlappyState>>(GAME_HUB_EVENTS.gameStarted, (event) => {
      if (event.gameType !== 'flappy-duo') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setFlappyState(event.state);
      setGameOver(null);
      setInputError(null);
    });

    const unsubscribeGameState = subscribe<GameStateUpdatedEvent<FlappyState>>(GAME_HUB_EVENTS.gameStateUpdated, (event) => {
      if (event.gameType !== 'flappy-duo') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setFlappyState(event.state);
    });

    const unsubscribeGameOver = subscribe<GameOverEvent<FlappyState>>(GAME_HUB_EVENTS.gameOver, (event) => {
      if (event.gameType !== 'flappy-duo') {
        return;
      }

      if (activeRoom && event.roomId !== activeRoom.roomId) {
        return;
      }

      setGameOver(event);
      setFlappyState(event.finalState ?? null);
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
        setFlappyState(null);
        setGameOver(null);
      }, 0);

      return () => {
        window.clearTimeout(resetId);
      };
    }

    void invoke<FlappyState | null>('GetCurrentGameState', activeRoom.roomId)
      .then((state) => {
        setFlappyState(state);
      })
      .catch(() => {
        setFlappyState(null);
      });
  }, [activeRoom, invoke]);

  const myPlayer = useMemo(() => {
    if (!flappyState) {
      return null;
    }

    return flappyState.players.find((player) => player.userId === currentUser.id) ?? null;
  }, [currentUser.id, flappyState]);

  const flap = async () => {
    if (!activeRoom || !myPlayer || !myPlayer.isAlive) {
      return false;
    }

    if (flappyState?.phase !== 'playing') {
      return false;
    }

    const now = Date.now();
    if (now - lastFlapAtRef.current < 45) {
      return false;
    }

    lastFlapAtRef.current = now;

    try {
      const accepted = await invoke<boolean>('SubmitFlappyInput', {
        roomId: activeRoom.roomId,
        action: 'flap',
      });

      if (!accepted) {
        setInputError('Flap was rejected by server.');
      } else {
        setInputError(null);
      }

      return accepted;
    } catch {
      setInputError('Unable to send flap input.');
      return false;
    }
  };

  const canControl = Boolean(
    flappyState
      && flappyState.phase === 'playing'
      && myPlayer
      && myPlayer.isAlive,
  );

  return {
    ...lobby,
    flappyState,
    gameOver,
    setGameOver,
    inputError,
    setInputError,
    flap,
    myPlayer,
    canControl,
  };
};
