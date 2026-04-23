import { useCallback, useEffect, useRef, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import type { AdminAppReviewFilters, AppReview } from '@/features/appReview/types/contracts';
import { getApiErrorMessage } from '@/shared/api/error';

const DEFAULT_PAGE_SIZE = 10;

interface UseAdminAppReviewsReturn {
  reviews: AppReview[];
  filters: AdminAppReviewFilters;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  setRatingFilter: (value: number | null) => void;
  setHiddenFilter: (value: boolean | null) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateReview: (item: AppReview) => void;
  removeReview: (reviewId: string) => void;
}

export const useAdminAppReviews = (pageSize = DEFAULT_PAGE_SIZE): UseAdminAppReviewsReturn => {
  const [reviews, setReviews] = useState<AppReview[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminAppReviewFilters>({
    rating: null,
    isHidden: null,
  });
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (targetPage: number, replace = false) => {
      if (loadingRef.current) {
        return;
      }

      loadingRef.current = true;
      if (replace) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const result = await appReviewService.getAdminReviews(targetPage, pageSize, filters);
        setReviews((previous) => (replace ? result.items : [...previous, ...result.items]));
        setPage(targetPage);
        setHasMore(result.hasMore);
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, 'Unable to load app reviews for admin.'));
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters, pageSize],
  );

  const refresh = useCallback(async () => {
    await loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore) {
      return;
    }

    await loadPage(page + 1, false);
  }, [hasMore, loadPage, page]);

  const setRatingFilter = useCallback((value: number | null) => {
    setFilters((previous) => ({
      ...previous,
      rating: value,
    }));
  }, []);

  const setHiddenFilter = useCallback((value: boolean | null) => {
    setFilters((previous) => ({
      ...previous,
      isHidden: value,
    }));
  }, []);

  const updateReview = useCallback((item: AppReview) => {
    setReviews((previous) => previous.map((review) => (review.id === item.id ? item : review)));
  }, []);

  const removeReview = useCallback((reviewId: string) => {
    setReviews((previous) => previous.filter((review) => review.id !== reviewId));
  }, []);

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage]);

  return {
    reviews,
    filters,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    setRatingFilter,
    setHiddenFilter,
    refresh,
    loadMore,
    updateReview,
    removeReview,
  };
};
