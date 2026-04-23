import clsx from 'clsx';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import type { AuthTone } from '@/features/auth/components/AuthBackground';
import { useAuthMobileViewport } from '@/features/auth/hooks/useAuthMobileViewport';
import {
  AUTH_CARD_HEADER_VARIANTS,
  AUTH_CARD_LAYOUT_TRANSITION,
  AUTH_CARD_VARIANTS,
} from '@/features/auth/animations/authMotion';

interface AuthCardProps {
  title: string;
  subtitle: string;
  tone?: AuthTone;
  children: ReactNode;
  footer?: ReactNode;
  headerKey?: string;
  layoutId?: string;
}

const toneBorderMap: Record<AuthTone, string> = {
  user: 'border-sky-200/20 shadow-[0_35px_80px_-35px_rgba(37,99,235,0.55)]',
  register: 'border-indigo-200/20 shadow-[0_35px_80px_-35px_rgba(99,102,241,0.58)]',
  recovery: 'border-cyan-200/20 shadow-[0_35px_80px_-35px_rgba(20,184,166,0.52)]',
  admin: 'border-rose-200/15 shadow-[0_35px_80px_-35px_rgba(244,63,94,0.45)]',
};

const toneGlowMap: Record<AuthTone, string> = {
  user: 'from-brand-500/30 via-sky-400/10 to-transparent',
  register: 'from-indigo-500/35 via-brand-500/12 to-transparent',
  recovery: 'from-teal-400/30 via-cyan-400/14 to-transparent',
  admin: 'from-rose-500/22 via-amber-500/10 to-transparent',
};

export const AuthCard = ({
  title,
  subtitle,
  tone = 'user',
  children,
  footer,
  headerKey,
  layoutId = 'auth-main-card',
}: AuthCardProps) => {
  const reduceMotion = useReducedMotion();
  const isMobileViewport = useAuthMobileViewport();
  const shouldReduceMotion = reduceMotion || isMobileViewport;

  return (
    <motion.section
      layout
      layoutId={layoutId}
      transition={shouldReduceMotion ? { duration: 0 } : AUTH_CARD_LAYOUT_TRANSITION}
      variants={shouldReduceMotion ? undefined : AUTH_CARD_VARIANTS}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
      className={clsx(
        'relative overflow-hidden rounded-[2rem] border bg-slate-950/55 p-5 backdrop-blur-2xl max-md:rounded-3xl max-md:bg-slate-950/80 max-md:backdrop-blur-md max-md:shadow-none sm:p-8',
        toneBorderMap[tone],
      )}
    >
      {!isMobileViewport ? (
        <>
          <div className={clsx('pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b', toneGlowMap[tone])} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_48%)]" />
        </>
      ) : null}

      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={headerKey ?? `${title}-${subtitle}`}
            variants={shouldReduceMotion ? undefined : AUTH_CARD_HEADER_VARIANTS}
            initial={shouldReduceMotion ? false : 'initial'}
            animate={shouldReduceMotion ? undefined : 'animate'}
            exit={shouldReduceMotion ? undefined : 'exit'}
          >
            <h2 className="text-2xl font-semibold text-white sm:text-[1.72rem]">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-200/75">{subtitle}</p>
          </motion.div>
        </AnimatePresence>

        <motion.div layout className="mt-6">
          {children}
        </motion.div>

        {footer ? (
          <motion.div layout className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-200/80">
            {footer}
          </motion.div>
        ) : null}
      </div>
    </motion.section>
  );
};
