import { Link } from 'react-router-dom';

import type { GameDefinition } from '@/features/games/types/common';

interface GameCardProps {
  game: GameDefinition;
}

export const GameCard = ({ game }: GameCardProps) => {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card dark:border-slate-700 dark:bg-slate-900/80 sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent_60%)] opacity-0 transition group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_60%)]" />
      <div className="relative">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{game.name}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{game.description}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Max players: {game.maxPlayers}
        </p>

        <Link
          to={game.routePath}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 sm:w-auto"
        >
          Play now
        </Link>
      </div>
    </article>
  );
};

