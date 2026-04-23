import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

export type AuthTone = 'user' | 'register' | 'recovery' | 'admin';

interface AuthBackgroundProps {
  tone?: AuthTone;
  compact?: boolean;
}

const STAR_PRIMARY_POSITIONS: Array<[number, number]> = [
  [7, 14],
  [15, 28],
  [22, 16],
  [31, 39],
  [39, 13],
  [48, 32],
  [56, 17],
  [64, 28],
  [72, 12],
  [81, 24],
  [90, 16],
  [12, 58],
  [24, 72],
  [35, 66],
  [47, 79],
  [58, 67],
  [69, 74],
  [81, 61],
  [90, 78],
  [95, 42],
];

const STAR_SECONDARY_POSITIONS: Array<[number, number]> = [
  [4, 42],
  [11, 35],
  [19, 52],
  [27, 44],
  [34, 57],
  [42, 49],
  [51, 56],
  [60, 46],
  [67, 58],
  [76, 51],
  [85, 59],
  [93, 52],
  [16, 86],
  [29, 82],
  [41, 89],
  [53, 84],
  [65, 88],
  [78, 83],
  [90, 90],
];

const buildStarLayer = (
  positions: Array<[number, number]>,
  colors: string[],
  radius: number,
  spread: number,
) =>
  positions
    .map(
      ([x, y], index) =>
        `radial-gradient(circle at ${x}% ${y}%, ${colors[index % colors.length]} 0 ${radius}px, transparent ${spread}px)`,
    )
    .join(', ');

const toneStyles: Record<
  AuthTone,
  {
    glowA: string;
    glowB: string;
    grain: string;
    nebula: string;
    starPrimaryColors: string[];
    starSecondaryColors: string[];
  }
> = {
  user: {
    glowA: 'from-sky-400/35 via-cyan-300/15 to-transparent',
    glowB: 'from-brand-500/35 via-indigo-500/15 to-transparent',
    grain: 'from-slate-950 via-slate-900 to-[#020617]',
    nebula:
      'radial-gradient(circle at 20% 18%, rgba(125,211,252,0.22), transparent 36%), radial-gradient(circle at 80% 8%, rgba(167,139,250,0.2), transparent 34%), radial-gradient(circle at 52% 100%, rgba(2,6,23,0.98), rgba(2,6,23,1))',
    starPrimaryColors: ['rgba(125,211,252,0.85)', 'rgba(196,181,253,0.86)', 'rgba(244,114,182,0.84)', 'rgba(103,232,249,0.82)'],
    starSecondaryColors: ['rgba(186,230,253,0.74)', 'rgba(216,180,254,0.74)', 'rgba(253,164,175,0.7)', 'rgba(165,243,252,0.68)'],
  },
  register: {
    glowA: 'from-brand-400/40 via-blue-400/20 to-transparent',
    glowB: 'from-fuchsia-500/35 via-indigo-500/20 to-transparent',
    grain: 'from-slate-950 via-[#0b1020] to-slate-950',
    nebula:
      'radial-gradient(circle at 22% 18%, rgba(96,165,250,0.2), transparent 38%), radial-gradient(circle at 78% 9%, rgba(244,114,182,0.22), transparent 34%), radial-gradient(circle at 50% 100%, rgba(5,7,20,0.96), rgba(2,6,23,1))',
    starPrimaryColors: ['rgba(129,140,248,0.85)', 'rgba(244,114,182,0.8)', 'rgba(125,211,252,0.82)', 'rgba(199,210,254,0.84)'],
    starSecondaryColors: ['rgba(167,139,250,0.72)', 'rgba(253,164,175,0.72)', 'rgba(186,230,253,0.7)', 'rgba(224,231,255,0.68)'],
  },
  recovery: {
    glowA: 'from-teal-400/35 via-cyan-400/15 to-transparent',
    glowB: 'from-brand-500/25 via-emerald-400/15 to-transparent',
    grain: 'from-slate-950 via-[#04141b] to-slate-950',
    nebula:
      'radial-gradient(circle at 22% 17%, rgba(45,212,191,0.22), transparent 36%), radial-gradient(circle at 77% 12%, rgba(125,211,252,0.2), transparent 36%), radial-gradient(circle at 50% 100%, rgba(2,15,23,0.98), rgba(2,6,23,1))',
    starPrimaryColors: ['rgba(94,234,212,0.82)', 'rgba(103,232,249,0.82)', 'rgba(167,243,208,0.8)', 'rgba(192,132,252,0.76)'],
    starSecondaryColors: ['rgba(153,246,228,0.72)', 'rgba(165,243,252,0.72)', 'rgba(187,247,208,0.7)', 'rgba(216,180,254,0.64)'],
  },
  admin: {
    glowA: 'from-rose-500/25 via-amber-400/10 to-transparent',
    glowB: 'from-slate-500/30 via-zinc-500/15 to-transparent',
    grain: 'from-[#050507] via-[#120b10] to-black',
    nebula:
      'radial-gradient(circle at 22% 16%, rgba(251,113,133,0.16), transparent 38%), radial-gradient(circle at 78% 11%, rgba(251,191,36,0.14), transparent 36%), radial-gradient(circle at 50% 100%, rgba(0,0,0,0.98), rgba(0,0,0,1))',
    starPrimaryColors: ['rgba(251,113,133,0.68)', 'rgba(252,211,77,0.62)', 'rgba(226,232,240,0.74)', 'rgba(253,164,175,0.66)'],
    starSecondaryColors: ['rgba(253,186,116,0.58)', 'rgba(254,205,211,0.58)', 'rgba(203,213,225,0.62)', 'rgba(251,146,60,0.52)'],
  },
};

export const AuthBackground = ({ tone = 'user', compact = false }: AuthBackgroundProps) => {
  const reduceMotion = useReducedMotion();
  const shouldReduceMotion = reduceMotion || compact;
  const style = toneStyles[tone];
  const primaryStars = compact
    ? ''
    : buildStarLayer(STAR_PRIMARY_POSITIONS, style.starPrimaryColors, 1.25, 2.2);
  const secondaryStars = compact
    ? ''
    : buildStarLayer(STAR_SECONDARY_POSITIONS, style.starSecondaryColors, 1.08, 2);

  if (compact) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={clsx('absolute inset-0 bg-gradient-to-br', style.grain)} />
        <div className="absolute inset-0" style={{ backgroundImage: style.nebula }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_42%)]" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={clsx('absolute inset-0 bg-gradient-to-br', style.grain)} />

      <motion.div
        className={clsx(
          'absolute -left-24 top-[-12rem] h-[26rem] w-[26rem] rounded-full bg-gradient-to-br blur-3xl sm:h-[32rem] sm:w-[32rem]',
          style.glowA,
        )}
        animate={
          shouldReduceMotion
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
          shouldReduceMotion
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

      <div
        className="auth-galaxy-stars absolute inset-[-6%] opacity-[0.72]"
        style={{
          backgroundImage: primaryStars,
          animation: shouldReduceMotion ? 'none' : undefined,
        }}
      />
      <div
        className="auth-galaxy-stars auth-galaxy-stars-alt absolute inset-[-12%] opacity-[0.58]"
        style={{
          backgroundImage: secondaryStars,
          animation: shouldReduceMotion ? 'none' : undefined,
        }}
      />

      <div className="absolute inset-0" style={{ backgroundImage: style.nebula }} />
      <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(115deg,rgba(148,163,184,0.52)_1px,transparent_1px),linear-gradient(205deg,rgba(148,163,184,0.3)_1px,transparent_1px)] [background-size:52px_52px]" />
    </div>
  );
};
