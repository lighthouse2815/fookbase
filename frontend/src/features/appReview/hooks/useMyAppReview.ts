import { useCallback, useEffect, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import type { AppReview } from '@/features/appReview/types/contracts';
import { getApiErrorMessage } from '@/shared/api/error';

interface UseMyAppReviewReturn {
  myReview: AppReview | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setMyReview: (value: AppReview | null) => void;
}

export const useMyAppReview = (enabled: boolean): UseMyAppReviewReturn => {
  const [myReview, setMyReview] = useState<AppReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setMyReview(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    try {
      const review = await appReviewService.getMyReview();
      setMyReview(review);
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load your review.'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    myReview,
    isLoading,
    error,
    refresh,
    setMyReview,
  };
};
