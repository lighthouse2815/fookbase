import { Ban, Flag, Settings, ShieldCheck, UserRound, UserSquare2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import type { SettingsTab, UseSettingsPageReturn } from '@/features/settings/types/hooks';
import type { SettingsTabId } from '@/features/settings/types/pages';
import { normalizeKeyword, parseTabId } from '@/features/settings/utils/page.util';

export const useSettingsPage = (): UseSettingsPageReturn => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState('');

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
        keywords: ['report', 'bao cao', 'post', 'bai viet'],
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
        id: 'system',
        label: t('settings.tabs.system.label'),
        description: t('settings.tabs.system.description'),
        keywords: ['he thong', 'system', 'theme', 'giao dien', 'language', 'ngon ngu'],
        icon: Settings,
      },
    ],
    [t],
  );

  const normalizedSearchKeyword = normalizeKeyword(searchKeyword);
  const queryTab = parseTabId(searchParams.get('tab'));

  const filteredTabs = useMemo(() => {
    if (!normalizedSearchKeyword) {
      return settingsTabs;
    }

    return settingsTabs.filter((item) => {
      const haystacks = [item.label, item.description, ...item.keywords].map((value) => normalizeKeyword(value));
      return haystacks.some((value) => value.includes(normalizedSearchKeyword));
    });
  }, [normalizedSearchKeyword, settingsTabs]);

  const activeTab = useMemo<SettingsTabId>(() => {
    if (filteredTabs.length === 0) {
      return queryTab ?? 'security';
    }

    if (queryTab && filteredTabs.some((item) => item.id === queryTab)) {
      return queryTab;
    }

    return filteredTabs[0].id;
  }, [filteredTabs, queryTab]);

  useEffect(() => {
    if (filteredTabs.length === 0) {
      return;
    }

    if (searchParams.get('tab') === activeTab) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', activeTab);
    setSearchParams(nextSearchParams, { replace: true });
  }, [activeTab, filteredTabs.length, searchParams, setSearchParams]);

  const handleSelectTab = useCallback(
    (tabId: SettingsTabId) => {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('tab', tabId);
      setSearchParams(nextSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const activeTabConfig = settingsTabs.find((item) => item.id === activeTab);
  const hasFilteredTabs = filteredTabs.length > 0;

  return {
    t,
    searchKeyword,
    setSearchKeyword,
    filteredTabs,
    activeTab,
    handleSelectTab,
    activeTabConfig,
    hasFilteredTabs,
  };
};
