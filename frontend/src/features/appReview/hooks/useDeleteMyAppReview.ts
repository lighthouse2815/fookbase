import { useCallback, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import { getApiErrorMessage } from '@/shared/api/error';

interface UseDeleteMyAppReviewReturn {
  isDeleting: boolean;
  error: string | null;
  deleteMyReview: () => Promise<void>;
}

export const useDeleteMyAppReview = (): UseDeleteMyAppReviewReturn => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMyReview = useCallback(async () => {
    setIsDeleting(true);
    try {
      await appReviewService.deleteMyReview();
      setError(null);
    } catch (deleteError) {
      const message = getApiErrorMessage(deleteError, 'Unable to delete your review.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    isDeleting,
    error,
    deleteMyReview,
  };
};
