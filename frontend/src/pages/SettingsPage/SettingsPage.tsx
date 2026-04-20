import { Search } from 'lucide-react';

import { BlockedUsersSettingsPage } from './BlockedUsersSettingsPage';
import { useSettingsPage } from './hooks/useSettingsPage';
import { PersonalInfoSettingsPage } from './PersonalInfoSettingsPage';
import { ProfilePageInfoSettingsPage } from './ProfilePageInfoSettingsPage';
import { ReportedPostsPage } from './ReportedPostsPage';
import { SecuritySettingsPage } from './SecuritySettingsPage';
import { SystemSettingsPage } from './SystemSettingsPage';

export const SettingsPage = () => {
  const {
    t,
    searchKeyword,
    setSearchKeyword,
    filteredTabs,
    activeTab,
    handleSelectTab,
    activeTabConfig,
    hasFilteredTabs,
  } = useSettingsPage();

  return (
    <div className="grid w-full min-w-0 gap-3 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-4 2xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-20 xl:self-start">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-5">
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('settings.title')}</h1>

          <label className="relative mt-3 block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder={t('settings.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          {filteredTabs.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {t('settings.notFound')}
            </p>
          ) : null}

          <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:hidden">
            {filteredTabs.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/70 dark:bg-brand-500/15 dark:text-brand-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 hidden space-y-2 xl:block">
            {filteredTabs.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    isActive
                      ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/70 dark:bg-brand-500/15 dark:text-brand-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    <p className="text-sm font-semibold">{item.label}</p>
                  </div>
                  <p className="mt-1 text-xs opacity-80">{item.description}</p>
                </button>
              );
            })}
          </div>
        </section>
      </aside>

      <section className="min-w-0 space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {hasFilteredTabs ? activeTabConfig?.label ?? t('settings.tabFallback') : t('settings.tabNotFound')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hasFilteredTabs
              ? activeTabConfig?.description ?? t('settings.panelDescriptionFallback')
              : t('settings.searchHintNoResult')}
          </p>
        </section>

        {hasFilteredTabs ? (
          <>
            {activeTab === 'security' ? <SecuritySettingsPage /> : null}
            {activeTab === 'personal-info' ? <PersonalInfoSettingsPage /> : null}
            {activeTab === 'profile-page-info' ? <ProfilePageInfoSettingsPage /> : null}
            {activeTab === 'reports' ? <ReportedPostsPage /> : null}
            {activeTab === 'blocked' ? <BlockedUsersSettingsPage /> : null}
            {activeTab === 'system' ? <SystemSettingsPage /> : null}
          </>
        ) : null}
      </section>
    </div>
  );
};
