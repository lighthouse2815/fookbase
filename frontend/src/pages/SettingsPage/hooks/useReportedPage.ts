import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PostReportItem, StoryReportItem, UserReportItem } from '@/interface/report';
import { postReportService } from '@/services/postReportService';
import { storyReportService } from '@/services/storyReportService';
import { userReportService } from '@/services/userReportService';
import { getApiErrorMessage } from '@/utils/apiError';

import type { ReportedPostsTabId, UseReportedPostsPageReturn } from '../interface';
import { REPORTED_POSTS_PAGE_SIZE } from '../util';

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
    loadError: loadErrorByTab[activeTab],
    loadReports,
  };
};
