import { useCallback, useEffect, useState } from 'react';

import { appReviewService } from '@/features/appReview/api/service/appReviewService';
import type { AppReviewSummary } from '@/features/appReview/types/contracts';
import { getApiErrorMessage } from '@/shared/api/error';

interface UseAppReviewSummaryReturn {
  summary: AppReviewSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAppReviewSummary = (): UseAppReviewSummaryReturn => {
  const [summary, setSummary] = useState<AppReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await appReviewService.getReviewSummary();
      setSummary(payload);
      setError(null);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Unable to load review summary.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    summary,
    isLoading,
    error,
    refresh,
  };
};
