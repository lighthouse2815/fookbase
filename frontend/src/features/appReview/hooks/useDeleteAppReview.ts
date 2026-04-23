import { useCallback, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import { getApiErrorMessage } from '@/shared/api/error';

interface UseDeleteAppReviewReturn {
  isDeleting: boolean;
  error: string | null;
  deleteReview: (reviewId: string) => Promise<void>;
}

export const useDeleteAppReview = (): UseDeleteAppReviewReturn => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReview = useCallback(async (reviewId: string) => {
    setIsDeleting(true);
    try {
      await appReviewService.deleteAdminReview(reviewId);
      setError(null);
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, 'Unable to delete app review.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    isDeleting,
    error,
    deleteReview,
  };
};
