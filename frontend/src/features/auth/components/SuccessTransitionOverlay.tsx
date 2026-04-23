import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type { AuthTransitionTone } from '@/features/auth/contexts/AuthSuccessTransitionContext';

interface SuccessTransitionOverlayProps {
  isActive: boolean;
  tone: AuthTransitionTone;
}

const toneMap: Record<AuthTransitionTone, { base: string; veil: string; sweep: string; ring: string; text: string }> = {
  user: {
    base: 'from-[#020617] via-[#07122f] to-[#020617]',
    veil: 'from-brand-500/35 via-cyan-300/18 to-transparent',
    sweep: 'from-transparent via-sky-100/18 to-transparent',
    ring: 'from-brand-300/55 via-sky-200/40 to-transparent',
    text: 'auth.successOverlayUser',
  },
  admin: {
    base: 'from-[#050507] via-[#160d12] to-[#020202]',
    veil: 'from-rose-400/26 via-amber-300/14 to-transparent',
    sweep: 'from-transparent via-rose-100/15 to-transparent',
    ring: 'from-rose-300/40 via-amber-200/28 to-transparent',
    text: 'auth.successOverlayAdmin',
  },
};

export const SuccessTransitionOverlay = ({
  isActive,
  tone,
}: SuccessTransitionOverlayProps) => {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const style = toneMap[tone];

  return (
    <AnimatePresence>
      {isActive ? (
        <motion.div
          key="auth-success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-0 z-[220] overflow-hidden"
        >
          <div className={clsx('absolute inset-0 bg-gradient-to-br', style.base)} />
          <motion.div
            className={clsx('absolute inset-0 bg-gradient-to-tr', style.veil)}
            initial={reduceMotion ? undefined : { opacity: 0.36 }}
            animate={reduceMotion ? undefined : { opacity: [0.36, 0.56, 0.44] }}
            transition={{ duration: 0.94, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.1),transparent_44%)]" />

          <motion.div
            className={clsx('absolute inset-y-[-16%] left-[-36%] w-[72%] bg-gradient-to-r', style.sweep)}
            initial={reduceMotion ? { x: '0%' } : { x: '-120%', rotate: -6 }}
            animate={reduceMotion ? { opacity: 0 } : { x: '190%', rotate: -6 }}
            transition={{ duration: 0.96, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
          />

          <motion.div
            className="absolute inset-0 grid place-items-center"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="relative rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-xl">
              <motion.span
                className={clsx('absolute -inset-px rounded-2xl bg-gradient-to-r opacity-40', style.ring)}
                initial={reduceMotion ? undefined : { opacity: 0.22, scale: 0.985 }}
                animate={reduceMotion ? undefined : { opacity: [0.22, 0.44, 0.3], scale: [0.985, 1, 0.996] }}
                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              />
              <div className="relative z-10">
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  Footbase
                </p>
                <p className="mt-1 text-center text-sm font-medium text-white">{t(style.text)}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
