import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface GameHeaderProps {
  title: string;
  description: string;
}

export const GameHeader = ({ title, description }: GameHeaderProps) => {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-5">
      <div className="mb-3">
        <Link
          to="/games"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-300"
        >
          <ArrowLeft size={16} />
          Back to games
        </Link>
      </div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </header>
  );
};
