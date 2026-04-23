import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type { AuthTransitionTone } from '@/features/auth/contexts/AuthSuccessTransitionContext';

interface SuccessTransitionOverlayProps {
  isActive: boolean;
  tone: AuthTransitionTone;
}

const toneMap: Record<AuthTransitionTone, { base: string; flare: string; text: string }> = {
  user: {
    base: 'from-slate-950 via-[#07112a] to-slate-950',
    flare: 'from-brand-400/70 via-cyan-300/35 to-transparent',
    text: 'auth.successOverlayUser',
  },
  admin: {
    base: 'from-[#0b090d] via-[#1a0e14] to-black',
    flare: 'from-rose-400/45 via-amber-300/20 to-transparent',
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
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.24, ease: [0.4, 0, 0.2, 1] }}
          className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
        >
          <div className={clsx('absolute inset-0 bg-gradient-to-br', style.base)} />
          <div className={clsx('absolute inset-0 bg-gradient-to-tr opacity-80', style.flare)} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.22),transparent_36%)]" />

          <motion.div
            className="absolute inset-y-[-35%] left-[-30%] w-[64%] bg-gradient-to-r from-white/0 via-white/30 to-white/0 blur-2xl"
            initial={reduceMotion ? { x: '0%' } : { x: '-140%', rotate: -8 }}
            animate={reduceMotion ? { opacity: 0 } : { x: '215%', rotate: -8 }}
            transition={{ duration: 1.08, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          />

          <motion.div
            className="absolute inset-0 grid place-items-center"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="rounded-2xl border border-white/30 bg-white/10 px-6 py-4 backdrop-blur-xl">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Footbase
              </p>
              <p className="mt-1 text-center text-sm font-medium text-white">{t(style.text)}</p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
