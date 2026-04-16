import { Ban, Flag, Monitor, Search, ShieldCheck, UserRound, UserSquare2, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { BlockedUsersSettingsPage } from './BlockedUsersSettingsPage';
import { PersonalInfoSettingsPage } from './PersonalInfoSettingsPage';
import { ProfilePageInfoSettingsPage } from './ProfilePageInfoSettingsPage';
import { ReportedPostsPage } from './ReportedPostsPage';
import { SecuritySettingsPage } from './SecuritySettingsPage';
import { SystemInterfaceSettingsPage } from './SystemInterfaceSettingsPage';

type SettingsTabId = 'security' | 'personal-info' | 'profile-page-info' | 'reports' | 'blocked' | 'system-interface';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
}

const parseTabId = (value: string | null): SettingsTabId | null => {
  if (
    value === 'security'
    || value === 'personal-info'
    || value === 'profile-page-info'
    || value === 'reports'
    || value === 'blocked'
    || value === 'system-interface'
  ) {
    return value;
  }

  return null;
};

const normalizeKeyword = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language).toLowerCase();
  const isVietnamese = currentLanguage.startsWith('vi');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => parseTabId(searchParams.get('tab')) ?? 'security');

  const settingsTabs = useMemo<SettingsTab[]>(
    () => [
      {
        id: 'security',
        label: t('settings.tabs.security.label'),
        description: t('settings.tabs.security.description'),
        keywords: ['bao mat', 'mat khau', 'otp', 'security'],
        icon: ShieldCheck,
      },
      {
        id: 'personal-info',
        label: t('settings.tabs.personalInfo.label'),
        description: t('settings.tabs.personalInfo.description'),
        keywords: ['thong tin', 'ca nhan', 'profile', 'avatar', 'display name'],
        icon: UserRound,
      },
      {
        id: 'profile-page-info',
        label: t('settings.tabs.profilePageInfo.label'),
        description: t('settings.tabs.profilePageInfo.description'),
        keywords: ['trang ca nhan', 'profile', 'public', 'thong tin profile'],
        icon: UserSquare2,
      },
      {
        id: 'reports',
        label: t('settings.tabs.reports.label'),
        description: t('settings.tabs.reports.description'),
        keywords: ['report', 'bao cao', 'post', 'comment', 'story', 'user'],
        icon: Flag,
      },
      {
        id: 'blocked',
        label: t('settings.tabs.blocked.label'),
        description: t('settings.tabs.blocked.description'),
        keywords: ['chan', 'block', 'blocked', 'danh sach chan'],
        icon: Ban,
      },
      {
        id: 'system-interface',
        label: isVietnamese ? 'Giao diện hệ thống' : 'System interface',
        description: isVietnamese ? 'Chế độ sáng/tối và ngôn ngữ hiển thị' : 'Light/dark mode and app language',
        keywords: ['giao dien', 'system', 'theme', 'dark mode', 'ngon ngu', 'language'],
        icon: Monitor,
      },
    ],
    [isVietnamese, t],
  );

  const normalizedSearchKeyword = normalizeKeyword(searchKeyword);

  const filteredTabs = useMemo(() => {
    if (!normalizedSearchKeyword) {
      return settingsTabs;
    }

    return settingsTabs.filter((item) => {
      const haystacks = [item.label, item.description, ...item.keywords].map((value) => normalizeKeyword(value));
      return haystacks.some((value) => value.includes(normalizedSearchKeyword));
    });
  }, [normalizedSearchKeyword, settingsTabs]);

  useEffect(() => {
    const queryTab = parseTabId(searchParams.get('tab'));
    if (queryTab && queryTab !== activeTab) {
      const syncId = window.setTimeout(() => {
        setActiveTab(queryTab);
      }, 0);

      return () => {
        window.clearTimeout(syncId);
      };
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (filteredTabs.length === 0) {
      return;
    }

    const hasActiveTab = filteredTabs.some((item) => item.id === activeTab);
    if (hasActiveTab) {
      return;
    }

    const fallbackTab = filteredTabs[0].id;
    const syncId = window.setTimeout(() => {
      setActiveTab(fallbackTab);
    }, 0);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', fallbackTab);
    setSearchParams(nextSearchParams, { replace: true });

    return () => {
      window.clearTimeout(syncId);
    };
  }, [activeTab, filteredTabs, searchParams, setSearchParams]);

  const handleSelectTab = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', tabId);
    setSearchParams(nextSearchParams, { replace: true });
  };

  const activeTabConfig = settingsTabs.find((item) => item.id === activeTab);
  const hasFilteredTabs = filteredTabs.length > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-20 xl:self-start">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
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

          <div className="mt-4 space-y-2">
            {filteredTabs.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {t('settings.notFound')}
              </p>
            ) : null}

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

      <section className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
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
            {activeTab === 'system-interface' ? <SystemInterfaceSettingsPage /> : null}
          </>
        ) : null}
      </section>
    </div>
  );
};

