import clsx from 'clsx';
import { X } from 'lucide-react';

import { SidebarItem } from '@/features/friendship/components/SidebarItem';
import type { UseFriendsPageReturn } from '@/features/friendship/hooks/useFriendsPage';

type FriendshipSidebarProps = Pick<
  UseFriendsPageReturn,
  | 't'
  | 'activeTab'
  | 'isSidebarOpen'
  | 'setIsSidebarOpen'
  | 'sidebarTabs'
  | 'receivedRequests'
  | 'suggestions'
  | 'friends'
  | 'handleChangeTab'
>;

export const FriendshipSidebar = ({
  t,
  activeTab,
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarTabs,
  receivedRequests,
  suggestions,
  friends,
  handleChangeTab,
}: FriendshipSidebarProps) => {
  return (
    <>
      {isSidebarOpen ? (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/50 xl:hidden"
          aria-label={t('friendsPage.closeMenuAria')}
        />
      ) : null}

      <aside
        className={clsx(
          'z-30 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/85',
          'xl:sticky xl:top-20 xl:h-[calc(100dvh-6rem)] xl:translate-x-0',
          'fixed left-2.5 top-20 h-[calc(100dvh-6rem)] w-[min(18rem,calc(100vw-1.5rem))] xl:static xl:w-auto',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-[110%] xl:translate-x-0',
        )}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('friendsPage.menuTitle')}</h2>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="space-y-2">
          {sidebarTabs.map((tab) => {
            const count =
              tab.id === 'requests'
                ? receivedRequests.length
                : tab.id === 'suggestions'
                  ? suggestions.length
                  : tab.id === 'friends'
                    ? friends.length
                    : undefined;

            return (
              <SidebarItem
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                active={activeTab === tab.id}
                count={count}
                onClick={() => {
                  handleChangeTab(tab.id);
                  setIsSidebarOpen(false);
                }}
              />
            );
          })}
        </nav>
      </aside>
    </>
  );
};
