import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  count?: number;
  onClick: () => void;
}

export const SidebarItem = ({ label, icon: Icon, active = false, count, onClick }: SidebarItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-all',
        active
          ? 'border-brand-400/50 bg-brand-100 text-brand-800 shadow-sm dark:border-brand-500/50 dark:bg-brand-500/20 dark:text-brand-200'
          : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/70',
      )}
    >
      <span className="inline-flex items-center gap-3">
        <span
          className={clsx(
            'inline-flex h-8 w-8 items-center justify-center rounded-xl',
            active
              ? 'bg-white/75 text-brand-700 dark:bg-slate-950/40 dark:text-brand-300'
              : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700/70 dark:text-slate-300',
          )}
        >
          <Icon size={17} />
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </span>

      {typeof count === 'number' ? (
        <span
          className={clsx(
            'min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold',
            active
              ? 'bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
};
