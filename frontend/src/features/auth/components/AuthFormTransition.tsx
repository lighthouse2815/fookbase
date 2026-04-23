import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { AUTH_FORM_CONTENT_VARIANTS } from '@/features/auth/animations/authMotion';
import { useAuthMobileViewport } from '@/features/auth/hooks/useAuthMobileViewport';

interface AuthFormTransitionProps {
  transitionKey: string;
  children: ReactNode;
  className?: string;
}

export const AuthFormTransition = ({
  transitionKey,
  children,
  className,
}: AuthFormTransitionProps) => {
  const reduceMotion = useReducedMotion();
  const isMobileViewport = useAuthMobileViewport();
  const shouldReduceMotion = reduceMotion || isMobileViewport;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        layout
        transition={shouldReduceMotion ? { duration: 0 } : undefined}
        variants={shouldReduceMotion ? undefined : AUTH_FORM_CONTENT_VARIANTS}
        initial={shouldReduceMotion ? false : 'initial'}
        animate={shouldReduceMotion ? undefined : 'animate'}
        exit={shouldReduceMotion ? undefined : 'exit'}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
