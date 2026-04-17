import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PostReportItem } from '@/interface/report';
import { postReportService } from '@/services/postReportService';
import { getApiErrorMessage } from '@/utils/apiError';

import type { UseReportedPostsPageReturn } from '../interface';
import { REPORTED_POSTS_PAGE_SIZE } from '../util';

export const useReportedPage = (): UseReportedPostsPageReturn => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<PostReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadReports = useCallback(async (targetPage: number, replace = false) => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await postReportService.getMine(targetPage, REPORTED_POSTS_PAGE_SIZE);
      setReports((previous) => (replace ? response.items : [...previous, ...response.items]));
      setHasMore(response.hasMore);
      setPage(targetPage);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, t('reportedPosts.loadError')));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadReports(1, true);
  }, [loadReports]);

  return {
    t,
    reports,
    page,
    hasMore,
    isLoading,
    loadError,
    loadReports,
  };
};
