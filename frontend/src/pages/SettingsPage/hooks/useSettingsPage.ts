import { Ban, Flag, Settings, ShieldCheck, UserRound, UserSquare2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import type { SettingsTab, UseSettingsPageReturn } from '../interface';
import type { SettingsTabId } from '../type';
import { normalizeKeyword, parseTabId } from '../util';

export const useSettingsPage = (): UseSettingsPageReturn => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const handleSelectTab = useCallback(
    (tabId: SettingsTabId) => {
      setActiveTab(tabId);
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
