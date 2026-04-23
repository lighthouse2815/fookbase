import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

export type AuthTone = 'user' | 'register' | 'recovery' | 'admin';

interface AuthBackgroundProps {
  tone?: AuthTone;
}

const toneStyles: Record<AuthTone, { glowA: string; glowB: string; grain: string }> = {
  user: {
    glowA: 'from-sky-400/35 via-cyan-300/15 to-transparent',
    glowB: 'from-brand-500/35 via-indigo-500/15 to-transparent',
    grain: 'from-slate-950 via-slate-900 to-[#020617]',
  },
  register: {
    glowA: 'from-brand-400/40 via-blue-400/20 to-transparent',
    glowB: 'from-fuchsia-500/35 via-indigo-500/20 to-transparent',
    grain: 'from-slate-950 via-[#0b1020] to-slate-950',
  },
  recovery: {
    glowA: 'from-teal-400/35 via-cyan-400/15 to-transparent',
    glowB: 'from-brand-500/25 via-emerald-400/15 to-transparent',
    grain: 'from-slate-950 via-[#04141b] to-slate-950',
  },
  admin: {
    glowA: 'from-rose-500/25 via-amber-400/10 to-transparent',
    glowB: 'from-slate-500/30 via-zinc-500/15 to-transparent',
    grain: 'from-[#050507] via-[#120b10] to-black',
  },
};

export const AuthBackground = ({ tone = 'user' }: AuthBackgroundProps) => {
  const reduceMotion = useReducedMotion();
  const style = toneStyles[tone];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={clsx('absolute inset-0 bg-gradient-to-br', style.grain)} />

      <motion.div
        className={clsx(
          'absolute -left-24 top-[-12rem] h-[26rem] w-[26rem] rounded-full bg-gradient-to-br blur-3xl sm:h-[32rem] sm:w-[32rem]',
          style.glowA,
        )}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, 18, 0],
                y: [0, 14, 0],
                scale: [1, 1.06, 1],
              }
        }
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 14,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className={clsx(
          'absolute -right-28 bottom-[-14rem] h-[24rem] w-[24rem] rounded-full bg-gradient-to-br blur-3xl sm:h-[34rem] sm:w-[34rem]',
          style.glowB,
        )}
        animate={
          reduceMotion
            ? undefined
            : {
                x: [0, -20, 0],
                y: [0, -12, 0],
                scale: [1, 1.08, 1],
              }
        }
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 16,
          ease: 'easeInOut',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.18),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.9),rgba(2,6,23,0.98))]" />
      <div className="absolute inset-0 opacity-[0.11] [background-image:linear-gradient(115deg,rgba(148,163,184,0.55)_1px,transparent_1px),linear-gradient(205deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:48px_48px]" />
    </div>
  );
};
