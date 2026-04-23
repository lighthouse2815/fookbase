import { useCallback, useEffect, useRef, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import type { PublicAppReview } from '@/features/appReview/types/contracts';
import { getApiErrorMessage } from '@/shared/api/error';

const DEFAULT_PAGE_SIZE = 6;

interface UsePublicAppReviewsReturn {
  reviews: PublicAppReview[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  ratingFilter: number | null;
  setRatingFilter: (value: number | null) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const usePublicAppReviews = (pageSize = DEFAULT_PAGE_SIZE): UsePublicAppReviewsReturn => {
  const [reviews, setReviews] = useState<PublicAppReview[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
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
        const result = await appReviewService.getPublicReviews(targetPage, pageSize, ratingFilter);
        setReviews((previous) => (replace ? result.items : [...previous, ...result.items]));
        setPage(targetPage);
        setHasMore(result.hasMore);
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, 'Unable to load app reviews.'));
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize, ratingFilter],
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

  useEffect(() => {
    void loadPage(1, true);
  }, [loadPage]);

  return {
    reviews,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    ratingFilter,
    setRatingFilter,
    refresh,
    loadMore,
  };
};
