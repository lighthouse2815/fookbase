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
        keywords: ['bảo mật', 'mật khẩu', 'otp', 'security'],
        icon: ShieldCheck,
      },
      {
        id: 'personal-info',
        label: t('settings.tabs.personalInfo.label'),
        description: t('settings.tabs.personalInfo.description'),
        keywords: ['thông tin', 'cá nhân', 'profile', 'avatar', 'display name'],
        icon: UserRound,
      },
      {
        id: 'profile-page-info',
        label: t('settings.tabs.profilePageInfo.label'),
        description: t('settings.tabs.profilePageInfo.description'),
        keywords: ['trang cá nhân', 'profile', 'public', 'thông tin profile'],
        icon: UserSquare2,
      },
      {
        id: 'reports',
        label: t('settings.tabs.reports.label'),
        description: t('settings.tabs.reports.description'),
        keywords: ['report', 'báo cáo', 'post', 'bài viết'],
        icon: Flag,
      },
      {
        id: 'blocked',
        label: t('settings.tabs.blocked.label'),
        description: t('settings.tabs.blocked.description'),
        keywords: ['chặn', 'block', 'blocked', 'danh sách chặn'],
        icon: Ban,
      },
      {
        id: 'system',
        label: t('settings.tabs.system.label'),
        description: t('settings.tabs.system.description'),
        keywords: ['hệ thống', 'system', 'theme', 'giao diện', 'language', 'ngôn ngữ'],
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
