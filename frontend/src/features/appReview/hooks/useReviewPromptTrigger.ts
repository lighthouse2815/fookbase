import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { appReviewService } from '@/features/appReview/api/service/appReviewService';

const PROMPT_DELAY_MS = 60_000;
const PROMPT_SUPPRESS_MS = 6 * 60 * 60 * 1000;
const SESSION_KEY_PREFIX = 'app_review_prompt_seen:';
const LOCAL_KEY_PREFIX = 'app_review_prompt_next_allowed:';

interface UseReviewPromptTriggerReturn {
  isPromptOpen: boolean;
  dismissPrompt: () => void;
  completePrompt: () => void;
}

const getStorageKeys = (userId: string) => ({
  sessionKey: `${SESSION_KEY_PREFIX}${userId}`,
  localKey: `${LOCAL_KEY_PREFIX}${userId}`,
});

const markPromptAsHandled = (userId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const { sessionKey, localKey } = getStorageKeys(userId);
  sessionStorage.setItem(sessionKey, '1');
  localStorage.setItem(localKey, String(Date.now() + PROMPT_SUPPRESS_MS));
};

const shouldSuppressPrompt = (userId: string): boolean => {
  if (typeof window === 'undefined') {
    return true;
  }

  const { sessionKey, localKey } = getStorageKeys(userId);
  if (sessionStorage.getItem(sessionKey) === '1') {
    return true;
  }

  const rawNextAllowedAt = localStorage.getItem(localKey);
  const nextAllowedAt = rawNextAllowedAt ? Number(rawNextAllowedAt) : 0;
  return Number.isFinite(nextAllowedAt) && nextAllowedAt > Date.now();
};

export const useReviewPromptTrigger = (): UseReviewPromptTriggerReturn => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearPromptTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const userId = user?.id;

    setIsPromptOpen(false);
    clearPromptTimer();

    if (!isAuthenticated || !userId || isAdmin) {
      return;
    }

    if (shouldSuppressPrompt(userId)) {
      return;
    }

    let isCancelled = false;
    const bootstrap = async () => {
      try {
        const myReview = await appReviewService.getMyReview();
        if (isCancelled || myReview) {
          return;
        }

        timerRef.current = window.setTimeout(() => {
          setIsPromptOpen(true);
          timerRef.current = null;
        }, PROMPT_DELAY_MS);
      } catch {
        // Skip prompt when API check fails.
      }
    };

    void bootstrap();

    return () => {
      isCancelled = true;
      clearPromptTimer();
    };
  }, [clearPromptTimer, isAdmin, isAuthenticated, user?.id]);

  const dismissPrompt = useCallback(() => {
    const userId = user?.id;
    if (userId) {
      markPromptAsHandled(userId);
    }

    setIsPromptOpen(false);
  }, [user?.id]);

  const completePrompt = useCallback(() => {
    const userId = user?.id;
    if (userId) {
      markPromptAsHandled(userId);
    }

    setIsPromptOpen(false);
  }, [user?.id]);

  return {
    isPromptOpen,
    dismissPrompt,
    completePrompt,
  };
};
