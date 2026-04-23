import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { AUTH_FORM_CONTENT_VARIANTS } from '@/features/auth/animations/authMotion';

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

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        layout
        variants={reduceMotion ? undefined : AUTH_FORM_CONTENT_VARIANTS}
        initial={reduceMotion ? false : 'initial'}
        animate={reduceMotion ? undefined : 'animate'}
        exit={reduceMotion ? undefined : 'exit'}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
