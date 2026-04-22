import clsx from 'clsx';
import { Filter, Search } from 'lucide-react';

import { UserCard } from '@/features/friendship/components/UserCard';
import type { UseFriendsPageReturn } from '@/features/friendship/hooks/useFriendsPage';

type FriendshipFriendsSectionProps = Pick<
  UseFriendsPageReturn,
  | 't'
  | 'filteredFriends'
  | 'friendSearch'
  | 'setFriendSearch'
  | 'friendFilters'
  | 'friendFilter'
  | 'setFriendFilter'
  | 'selectedUserId'
  | 'handleSelectUser'
  | 'handleMessageUser'
  | 'requestUnfriend'
>;

export const FriendshipFriendsSection = ({
  t,
  filteredFriends,
  friendSearch,
  setFriendSearch,
  friendFilters,
  friendFilter,
  setFriendFilter,
  selectedUserId,
  handleSelectUser,
  handleMessageUser,
  requestUnfriend,
}: FriendshipFriendsSectionProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/75 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('friendsPage.friendsTitle')}</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t('friendsPage.resultCount', { count: filteredFriends.length })}</span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={friendSearch}
            onChange={(event) => setFriendSearch(event.target.value)}
            placeholder={t('friendsPage.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>

        <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          <Filter size={14} className="ml-2 shrink-0 text-slate-400" />
          {friendFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setFriendFilter(filter.id)}
              className={clsx(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                friendFilter === filter.id
                  ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      {filteredFriends.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.empty.friendsFiltered')}</p>
      ) : (
        <div className="space-y-3">
          {filteredFriends.map((friend) => (
            <UserCard
              key={friend.id}
              user={friend}
              variant="list"
              selected={selectedUserId === friend.id}
              onSelect={() => handleSelectUser(friend.id)}
              statusText={friend.isOnline ? t('friendsPage.status.online') : t('friendsPage.status.offline')}
              primaryActionLabel={t('friendsPage.actions.message')}
              onPrimaryAction={() => handleMessageUser(friend.id)}
              secondaryActionLabel={t('friendsPage.actions.unfriend')}
              onSecondaryAction={() => requestUnfriend(friend.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
