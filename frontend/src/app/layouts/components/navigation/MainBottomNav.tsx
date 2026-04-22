import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { NAV_ITEMS } from '@/app/layouts/components/navbar/util';

export const MainBottomNav = () => {
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1.5">
        {NAV_ITEMS.map(({ key, icon: Icon, path }) => (
          <NavLink
            key={key}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `inline-flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-medium sm:text-[11px] ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`
            }
          >
            <Icon size={18} />
            <span>{t(`nav.${key}`)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

