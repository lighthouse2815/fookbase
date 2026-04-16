import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { gamesApi } from '../../services/games/gamesApi';
import type { GameDefinition, GameRoom } from '../../types/games/common';
import { GameCard } from '../../components/games/shared/GameCard';

const gameTypeToRoute: Record<string, string> = {
  chess: '/games/chess',
  caro: '/games/caro',
  'snake-duo': '/games/snake-duo',
  'flappy-duo': '/games/flappy-duo',
};

export const GamesPage = () => {
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [gameList, roomList] = await Promise.all([gamesApi.getGames(), gamesApi.getRooms()]);
      setGames(gameList);
      setRooms(roomList.filter((room) => !room.isDeleted));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load games page.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void gamesApi.getRooms()
        .then((roomList) => {
          setRooms(roomList.filter((room) => !room.isDeleted));
        })
        .catch(() => undefined);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const roomsByGameType = useMemo(() => {
    return rooms.reduce<Record<string, GameRoom[]>>((accumulator, room) => {
      if (!accumulator[room.gameType]) {
        accumulator[room.gameType] = [];
      }
      accumulator[room.gameType].push(room);
      return accumulator;
    }, {});
  }, [rooms]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Real-time Games</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Play online with your friends directly inside the social app.
        </p>
      </section>

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
          Loading games...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </section>
      ) : null}

      {!isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.gameType} game={game} />
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Open rooms</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Join a room or open game page to create a new one.</p>

        <div className="mt-4 space-y-3">
          {rooms.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No rooms online right now.
            </p>
          ) : (
            rooms.map((room) => (
              <div
                key={room.roomId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {room.gameType} • Room <span className="font-mono">{room.roomCode}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {room.players.length}/{room.maxPlayers} players • {room.status}
                  </p>
                </div>
                <Link
                  to={`${gameTypeToRoute[room.gameType] ?? '/games'}?code=${encodeURIComponent(room.roomCode)}`}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-500"
                >
                  Join
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {Object.entries(roomsByGameType).length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rooms by game</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Object.entries(roomsByGameType).map(([gameType, roomList]) => (
              <article key={gameType} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{gameType}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{roomList.length} room(s)</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

