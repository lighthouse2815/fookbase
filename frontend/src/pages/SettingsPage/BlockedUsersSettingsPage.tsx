import { Ban, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const BlockedUsersSettingsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
            <Ban size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('blockedUsersSettings.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('blockedUsersSettings.subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <ShieldAlert size={24} />
        </div>
        <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('blockedUsersSettings.emptyTitle')}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('blockedUsersSettings.emptySubtitle')}
        </p>
      </section>
    </div>
  );
};
