import { useCallback, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import type { AppReview } from '@/features/appReview/types/contracts';
import { getApiErrorMessage } from '@/shared/api/error';

interface UseHideAppReviewReturn {
  isSubmitting: boolean;
  error: string | null;
  toggleHidden: (reviewId: string, hide: boolean) => Promise<AppReview>;
}

export const useHideAppReview = (): UseHideAppReviewReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleHidden = useCallback(async (reviewId: string, hide: boolean) => {
    setIsSubmitting(true);
    try {
      const updated = hide
        ? await appReviewService.hideAdminReview(reviewId)
        : await appReviewService.unhideAdminReview(reviewId);
      setError(null);
      return updated;
    } catch (submitError) {
      const message = getApiErrorMessage(
        submitError,
        hide ? 'Unable to hide app review.' : 'Unable to unhide app review.',
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    toggleHidden,
  };
};
