import { UserRoundSearch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import { FriendCard } from '../components/FriendCard';
import type { MainLayoutOutletContext } from '../layouts/MainLayout';

export const FriendsPage = () => {
  const { t } = useTranslation();
  const { suggestions } = useOutletContext<MainLayoutOutletContext>();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('friendsPage.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('friendsPage.subtitle')}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
        <div className="mb-4 flex items-center gap-2">
          <UserRoundSearch size={18} className="text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('friendsPage.suggestions')}
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <FriendCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </div>
      </section>
    </div>
  );
};

