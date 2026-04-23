/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { SuccessTransitionOverlay } from '@/features/auth/components/SuccessTransitionOverlay';

export type AuthTransitionTone = 'user' | 'admin';

interface PlaySuccessTransitionParams {
  onNavigate: () => void;
  tone?: AuthTransitionTone;
}

interface AuthSuccessTransitionContextValue {
  playSuccessTransition: (params: PlaySuccessTransitionParams) => void;
  isTransitioning: boolean;
  landingTone: AuthTransitionTone | null;
  clearLandingTone: () => void;
}

interface AuthSuccessTransitionProviderProps {
  children: ReactNode;
}

const AuthSuccessTransitionContext = createContext<AuthSuccessTransitionContextValue | undefined>(undefined);

export const AuthSuccessTransitionProvider = ({
  children,
}: AuthSuccessTransitionProviderProps) => {
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayTone, setOverlayTone] = useState<AuthTransitionTone>('user');
  const [landingTone, setLandingTone] = useState<AuthTransitionTone | null>(null);
  const timeoutRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timeoutRef.current.forEach((id) => window.clearTimeout(id));
    timeoutRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!isOverlayActive) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOverlayActive]);

  const playSuccessTransition = useCallback(
    ({ onNavigate, tone = 'user' }: PlaySuccessTransitionParams) => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      clearTimers();

      if (prefersReducedMotion) {
        setIsTransitioning(false);
        setLandingTone(tone);
        onNavigate();
        return;
      }

      setIsTransitioning(true);
      setOverlayTone(tone);
      setIsOverlayActive(true);

      const navigateTimeout = window.setTimeout(() => {
        setLandingTone(tone);
        onNavigate();
      }, 560);

      const closeTimeout = window.setTimeout(() => {
        setIsOverlayActive(false);
        setIsTransitioning(false);
      }, 1180);

      timeoutRef.current.push(navigateTimeout, closeTimeout);
    },
    [clearTimers],
  );

  const clearLandingTone = useCallback(() => {
    setLandingTone(null);
  }, []);

  const value = useMemo(
    () => ({
      playSuccessTransition,
      isTransitioning,
      landingTone,
      clearLandingTone,
    }),
    [clearLandingTone, isTransitioning, landingTone, playSuccessTransition],
  );

  return (
    <AuthSuccessTransitionContext.Provider value={value}>
      {children}
      <SuccessTransitionOverlay isActive={isOverlayActive} tone={overlayTone} />
    </AuthSuccessTransitionContext.Provider>
  );
};

export const useAuthSuccessTransition = (): AuthSuccessTransitionContextValue => {
  const context = useContext(AuthSuccessTransitionContext);

  if (!context) {
    throw new Error('useAuthSuccessTransition must be used within AuthSuccessTransitionProvider');
  }

  return context;
};
