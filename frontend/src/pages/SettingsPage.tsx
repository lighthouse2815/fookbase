import { Ban, Flag, LockKeyhole, Search, UserRound, UserSquare2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BlockedUsersSettingsPage } from './BlockedUsersSettingsPage';
import { PersonalInfoSettingsPage } from './PersonalInfoSettingsPage';
import { ProfilePageInfoSettingsPage } from './ProfilePageInfoSettingsPage';
import { ReportedPostsPage } from './ReportedPostsPage';
import { SecuritySettingsPage } from './SecuritySettingsPage';

type SettingsTabId = 'security' | 'personal-info' | 'profile-page-info' | 'reports' | 'blocked';

interface SettingsTab {
  id: SettingsTabId;
  label: string;
  description: string;
  keywords: string[];
  icon: typeof LockKeyhole;
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'security',
    label: 'Bao mat',
    description: 'Mat khau, OTP, bao ve tai khoan',
    keywords: ['bao mat', 'mat khau', 'otp', 'security'],
    icon: LockKeyhole,
  },
  {
    id: 'personal-info',
    label: 'Thong tin ca nhan',
    description: 'Ten hien thi, avatar, ngay sinh, gioi tinh',
    keywords: ['thong tin', 'ca nhan', 'profile', 'avatar', 'display name'],
    icon: UserRound,
  },
  {
    id: 'profile-page-info',
    label: 'Thong tin tren trang ca nhan',
    description: 'Thong tin public hien thi tren profile',
    keywords: ['trang ca nhan', 'profile', 'public', 'thong tin profile'],
    icon: UserSquare2,
  },
  {
    id: 'reports',
    label: 'Bai viet da report',
    description: 'Danh sach bai viet ban da bao cao',
    keywords: ['report', 'bao cao', 'post', 'bai viet'],
    icon: Flag,
  },
  {
    id: 'blocked',
    label: 'Danh sach chan',
    description: 'Quan ly nhung tai khoan da chan',
    keywords: ['chan', 'block', 'blocked', 'danh sach chan'],
    icon: Ban,
  },
];

const parseTabId = (value: string | null): SettingsTabId | null => {
  if (
    value === 'security'
    || value === 'personal-info'
    || value === 'profile-page-info'
    || value === 'reports'
    || value === 'blocked'
  ) {
    return value;
  }

  return null;
};

const normalizeKeyword = (value: string): string => value.trim().toLowerCase();

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTabId>(() => parseTabId(searchParams.get('tab')) ?? 'security');

  const normalizedSearchKeyword = normalizeKeyword(searchKeyword);

  const filteredTabs = useMemo(() => {
    if (!normalizedSearchKeyword) {
      return SETTINGS_TABS;
    }

    return SETTINGS_TABS.filter((item) => {
      const haystacks = [item.label, item.description, ...item.keywords].map((value) => normalizeKeyword(value));
      return haystacks.some((value) => value.includes(normalizedSearchKeyword));
    });
  }, [normalizedSearchKeyword]);

  useEffect(() => {
    const queryTab = parseTabId(searchParams.get('tab'));
    if (queryTab && queryTab !== activeTab) {
      setActiveTab(queryTab);
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
    setActiveTab(fallbackTab);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', fallbackTab);
    setSearchParams(nextSearchParams, { replace: true });
  }, [activeTab, filteredTabs, searchParams, setSearchParams]);

  const handleSelectTab = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', tabId);
    setSearchParams(nextSearchParams, { replace: true });
  };

  const activeTabConfig = SETTINGS_TABS.find((item) => item.id === activeTab);
  const hasFilteredTabs = filteredTabs.length > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-20 xl:self-start">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Cai dat va quyen rieng tu</h1>

          <label className="relative mt-3 block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tim kiem cai dat"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <div className="mt-4 space-y-2">
            {filteredTabs.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Khong tim thay chuc nang phu hop.
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
            {hasFilteredTabs ? activeTabConfig?.label ?? 'Cai dat' : 'Khong tim thay chuc nang'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hasFilteredTabs
              ? activeTabConfig?.description ?? 'Quan ly cac tuy chon tai khoan cua ban.'
              : 'Thu thay doi tu khoa tim kiem de hien thi lai danh sach chuc nang.'}
          </p>
        </section>

        {hasFilteredTabs ? (
          <>
            {activeTab === 'security' ? <SecuritySettingsPage /> : null}
            {activeTab === 'personal-info' ? <PersonalInfoSettingsPage /> : null}
            {activeTab === 'profile-page-info' ? <ProfilePageInfoSettingsPage /> : null}
            {activeTab === 'reports' ? <ReportedPostsPage /> : null}
            {activeTab === 'blocked' ? <BlockedUsersSettingsPage /> : null}
          </>
        ) : null}
      </section>
    </div>
  );
};
