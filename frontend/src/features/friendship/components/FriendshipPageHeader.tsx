import { Menu, RefreshCcw } from 'lucide-react';

import type { UseFriendsPageReturn } from '@/features/friendship/hooks/useFriendsPage';

type FriendshipPageHeaderProps = Pick<
  UseFriendsPageReturn,
  't' | 'tabTitle' | 'errorMessage' | 'loadFriendData' | 'setIsSidebarOpen'
>;

export const FriendshipPageHeader = ({
  t,
  tabTitle,
  errorMessage,
  loadFriendData,
  setIsSidebarOpen,
}: FriendshipPageHeaderProps) => {
  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('friendsPage.managementTitle')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{tabTitle}</p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => void loadFriendData()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:flex-none"
          >
            <RefreshCcw size={15} />
            {t('friendsPage.refresh')}
          </button>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300 xl:hidden"
            aria-label={t('friendsPage.openMenuAria')}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-xl border border-amber-300/50 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
          {errorMessage}
        </p>
      ) : null}
    </header>
  );
};
