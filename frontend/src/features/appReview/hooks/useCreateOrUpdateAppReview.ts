import { useCallback, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import type { AppReview, CreateOrUpdateAppReviewPayload } from '@/features/appReview/types/contracts';
import { getApiErrorMessage } from '@/shared/api/error';

interface UseCreateOrUpdateAppReviewReturn {
  isSubmitting: boolean;
  error: string | null;
  createOrUpdate: (payload: CreateOrUpdateAppReviewPayload) => Promise<AppReview>;
}

export const useCreateOrUpdateAppReview = (): UseCreateOrUpdateAppReviewReturn => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrUpdate = useCallback(async (payload: CreateOrUpdateAppReviewPayload) => {
    setIsSubmitting(true);
    try {
      const response = await appReviewService.createOrUpdateMyReview(payload);
      setError(null);
      return response;
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to save your review.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    createOrUpdate,
  };
};
