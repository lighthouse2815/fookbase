import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyStateCard = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}: EmptyStateCardProps) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="relative p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_55%)]" />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            <Icon size={22} />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">{description}</p>

          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
};

