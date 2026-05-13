import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PostReportItem, StoryReportItem, UserReportItem } from '@/features/admin/types/report';
import { storyReportService } from '@/features/admin/api/service/storyReportService';
import { userReportService } from '@/features/admin/api/service/userReportService';
import { postReportService } from '@/features/post/api/service/postReportService';
import { getApiErrorMessage } from '@/shared/api/error';

import type { ReportedPostsTabId, UseReportedPostsPageReturn } from '@/features/settings/types/hooks';
import { REPORTED_POSTS_PAGE_SIZE } from '@/features/settings/utils/page.util';

type TabReportsMap = {
  post: PostReportItem[];
  story: StoryReportItem[];
  user: UserReportItem[];
};

type TabNumberMap = Record<ReportedPostsTabId, number>;
type TabBooleanMap = Record<ReportedPostsTabId, boolean>;
type TabErrorMap = Record<ReportedPostsTabId, string | null>;

const INITIAL_PAGE_BY_TAB: TabNumberMap = {
  post: 1,
  story: 1,
  user: 1,
};

const INITIAL_HAS_MORE_BY_TAB: TabBooleanMap = {
  post: true,
  story: true,
  user: true,
};

const INITIAL_LOADING_BY_TAB: TabBooleanMap = {
  post: false,
  story: false,
  user: false,
};

const INITIAL_LOADED_BY_TAB: TabBooleanMap = {
  post: false,
  story: false,
  user: false,
};

const INITIAL_ERROR_BY_TAB: TabErrorMap = {
  post: null,
  story: null,
  user: null,
};

export const useReportedPage = (): UseReportedPostsPageReturn => {
  const { t } = useTranslation();
  const [activeTab, setActiveTabState] = useState<ReportedPostsTabId>('post');
  const [reportsByTab, setReportsByTab] = useState<TabReportsMap>({
    post: [],
    story: [],
    user: [],
  });
  const [pageByTab, setPageByTab] = useState<TabNumberMap>(INITIAL_PAGE_BY_TAB);
  const [hasMoreByTab, setHasMoreByTab] = useState<TabBooleanMap>(INITIAL_HAS_MORE_BY_TAB);
  const [isLoadingByTab, setIsLoadingByTab] = useState<TabBooleanMap>(INITIAL_LOADING_BY_TAB);
  const [loadedByTab, setLoadedByTab] = useState<TabBooleanMap>(INITIAL_LOADED_BY_TAB);
  const [loadErrorByTab, setLoadErrorByTab] = useState<TabErrorMap>(INITIAL_ERROR_BY_TAB);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  const loadingRef = useRef<TabBooleanMap>({
    post: false,
    story: false,
    user: false,
  });

  const setActiveTab = useCallback((tab: ReportedPostsTabId) => {
    setActiveTabState(tab);
  }, []);

  const loadReportsByTab = useCallback(async (tab: ReportedPostsTabId, targetPage: number, replace = false) => {
    if (loadingRef.current[tab]) {
      return;
    }

    loadingRef.current[tab] = true;
    setIsLoadingByTab((previous) => ({
      ...previous,
      [tab]: true,
    }));
    setLoadErrorByTab((previous) => ({
      ...previous,
      [tab]: null,
    }));

    try {
      if (tab === 'post') {
        const response = await postReportService.getMine(targetPage, REPORTED_POSTS_PAGE_SIZE);
        setReportsByTab((previous) => ({
          ...previous,
          post: replace ? response.items : [...previous.post, ...response.items],
        }));
        setHasMoreByTab((previous) => ({
          ...previous,
          post: response.hasMore,
        }));
      }

      if (tab === 'story') {
        const response = await storyReportService.getMine(targetPage, REPORTED_POSTS_PAGE_SIZE);
        setReportsByTab((previous) => ({
          ...previous,
          story: replace ? response.items : [...previous.story, ...response.items],
        }));
        setHasMoreByTab((previous) => ({
          ...previous,
          story: response.hasMore,
        }));
      }

      if (tab === 'user') {
        const response = await userReportService.getMine(targetPage, REPORTED_POSTS_PAGE_SIZE);
        setReportsByTab((previous) => ({
          ...previous,
          user: replace ? response.items : [...previous.user, ...response.items],
        }));
        setHasMoreByTab((previous) => ({
          ...previous,
          user: response.hasMore,
        }));
      }

      setPageByTab((previous) => ({
        ...previous,
        [tab]: targetPage,
      }));
      setLoadedByTab((previous) => ({
        ...previous,
        [tab]: true,
      }));
    } catch (error) {
      setLoadErrorByTab((previous) => ({
        ...previous,
        [tab]: getApiErrorMessage(error, t('reportedPosts.loadError')),
      }));
    } finally {
      loadingRef.current[tab] = false;
      setIsLoadingByTab((previous) => ({
        ...previous,
        [tab]: false,
      }));
    }
  }, [t]);

  const loadReports = useCallback(async (targetPage: number, replace = false) => {
    await loadReportsByTab(activeTab, targetPage, replace);
  }, [activeTab, loadReportsByTab]);

  const deleteReport = useCallback(async (reportId: string) => {
    const trimmedReportId = reportId.trim();
    if (!trimmedReportId || deletingReportId === trimmedReportId) {
      return;
    }

    setDeletingReportId(trimmedReportId);
    setLoadErrorByTab((previous) => ({
      ...previous,
      [activeTab]: null,
    }));

    try {
      if (activeTab === 'post') {
        await postReportService.remove(trimmedReportId);
      } else if (activeTab === 'story') {
        await storyReportService.remove(trimmedReportId);
      } else {
        await userReportService.remove(trimmedReportId);
      }

      setReportsByTab((previous) => ({
        ...previous,
        [activeTab]: previous[activeTab].filter((report) => report.id !== trimmedReportId),
      }));
    } catch (error) {
      setLoadErrorByTab((previous) => ({
        ...previous,
        [activeTab]: getApiErrorMessage(error, t('reportedPosts.deleteError')),
      }));
    } finally {
      setDeletingReportId((current) => (current === trimmedReportId ? null : current));
    }
  }, [activeTab, deletingReportId, t]);

  useEffect(() => {
    if (loadedByTab[activeTab]) {
      return;
    }

    void loadReportsByTab(activeTab, 1, true);
  }, [activeTab, loadedByTab, loadReportsByTab]);

  const reports = useMemo(
    () => reportsByTab[activeTab],
    [activeTab, reportsByTab],
  );

  return {
    t,
    activeTab,
    setActiveTab,
    reports,
    page: pageByTab[activeTab],
    hasMore: hasMoreByTab[activeTab],
    isLoading: isLoadingByTab[activeTab],
    deletingReportId,
    loadError: loadErrorByTab[activeTab],
    loadReports,
    deleteReport,
  };
};
