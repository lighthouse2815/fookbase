import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocaleText } from '@/shared/i18n/useLocaleText';
import type { AdminHashtagUsageItem } from '@/features/admin/types/admin';
import { adminService } from '@/features/admin/api/service/adminService';
import { getApiErrorMessage } from '@/shared/api/error';
import { PAGE_SIZE } from '@/features/admin/utils/report.util';

export const useAdminHashtagsPage = () => {
  const tx = useLocaleText();
  const [currentMonth, setCurrentMonth] = useState('');
  const [topHashtags, setTopHashtags] = useState<AdminHashtagUsageItem[]>([]);
  const [hashtags, setHashtags] = useState<AdminHashtagUsageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadHashtags = useCallback(
    async (targetPage: number, replace = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);
      try {
        const response = await adminService.getHashtagOverview(targetPage, PAGE_SIZE);

        setCurrentMonth(response.currentMonth);
        setTopHashtags(response.topHashtags);
        setHashtags((previous) => (replace ? response.items : [...previous, ...response.items]));
        setHasMore(response.hasMore);
        setPage(response.page);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, tx('Không thể tải thống kê hashtag.', 'Could not load hashtag analytics.')));
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [tx],
  );

  useEffect(() => {
    void loadHashtags(1, true);
  }, [loadHashtags]);

  return {
    tx,
    currentMonth,
    topHashtags,
    hashtags,
    page,
    hasMore,
    isLoading,
    errorMessage,
    loadHashtags,
  };
};
