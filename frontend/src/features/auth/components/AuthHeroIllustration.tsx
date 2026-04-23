import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Heart, ImageIcon, MessageCircleMore, Share2, Sparkles, Users } from 'lucide-react';

import type { AuthTone } from '@/features/auth/components/AuthBackground';

interface AuthHeroIllustrationProps {
  tone?: AuthTone;
}

const toneClassMap: Record<
  AuthTone,
  {
    shell: string;
    glow: string;
    line: string;
    node: string;
    centerTop: string;
    centerMedia: string;
    chip: string;
  }
> = {
  user: {
    shell: 'border-sky-200/20',
    glow: 'from-sky-400/20 via-indigo-400/12 to-transparent',
    line: 'stroke-sky-200/35',
    node: 'border-sky-200/35 bg-sky-300/14 text-sky-100',
    centerTop: 'from-sky-300/25 via-sky-100/10 to-transparent',
    centerMedia: 'from-sky-400/30 via-indigo-400/20 to-brand-500/28',
    chip: 'border-sky-200/25 bg-sky-300/14 text-sky-100/90',
  },
  register: {
    shell: 'border-indigo-200/20',
    glow: 'from-indigo-400/22 via-brand-400/12 to-transparent',
    line: 'stroke-indigo-200/35',
    node: 'border-indigo-200/35 bg-indigo-300/14 text-indigo-100',
    centerTop: 'from-indigo-300/25 via-indigo-100/10 to-transparent',
    centerMedia: 'from-indigo-400/32 via-brand-500/22 to-fuchsia-400/26',
    chip: 'border-indigo-200/25 bg-indigo-300/14 text-indigo-100/90',
  },
  recovery: {
    shell: 'border-teal-200/20',
    glow: 'from-teal-400/22 via-cyan-400/12 to-transparent',
    line: 'stroke-teal-200/35',
    node: 'border-teal-200/35 bg-teal-300/14 text-teal-100',
    centerTop: 'from-teal-300/24 via-cyan-100/10 to-transparent',
    centerMedia: 'from-teal-400/34 via-cyan-500/18 to-emerald-400/26',
    chip: 'border-teal-200/25 bg-teal-300/14 text-teal-100/90',
  },
  admin: {
    shell: 'border-rose-200/18',
    glow: 'from-rose-400/18 via-amber-400/10 to-transparent',
    line: 'stroke-rose-200/30',
    node: 'border-rose-200/30 bg-rose-300/12 text-rose-100',
    centerTop: 'from-rose-300/22 via-amber-100/8 to-transparent',
    centerMedia: 'from-rose-400/28 via-amber-400/16 to-orange-400/22',
    chip: 'border-rose-200/22 bg-rose-300/12 text-rose-100/90',
  },
};

const orbitNodes = [
  { id: 'members', Icon: Users, className: 'left-[7%] top-[24%]', delay: 0 },
  { id: 'share', Icon: Share2, className: 'right-[7%] top-[22%]', delay: 0.3 },
  { id: 'content', Icon: ImageIcon, className: 'left-[10%] bottom-[20%]', delay: 0.55 },
  { id: 'messages', Icon: MessageCircleMore, className: 'right-[9%] bottom-[18%]', delay: 0.8 },
  { id: 'spark', Icon: Sparkles, className: 'left-1/2 top-[6%] -translate-x-1/2', delay: 1.05 },
  { id: 'react', Icon: Heart, className: 'left-1/2 bottom-[5%] -translate-x-1/2', delay: 1.25 },
] as const;

export const AuthHeroIllustration = ({ tone = 'user' }: AuthHeroIllustrationProps) => {
  const reduceMotion = useReducedMotion();
  const palette = toneClassMap[tone];

  return (
    <div className="relative mt-7 hidden lg:block">
      <div
        className={clsx(
          'relative overflow-hidden rounded-[1.8rem] border bg-white/[0.04] p-5 backdrop-blur-2xl',
          palette.shell,
        )}
      >
        <div className={clsx('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b', palette.glow)} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_48%)]" />

        <div className="relative h-[250px]">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" fill="none" aria-hidden>
            <line x1="50" y1="50" x2="18" y2="29" className={clsx('stroke-[0.45]', palette.line)} />
            <line x1="50" y1="50" x2="82" y2="27" className={clsx('stroke-[0.45]', palette.line)} />
            <line x1="50" y1="50" x2="19" y2="72" className={clsx('stroke-[0.45]', palette.line)} />
            <line x1="50" y1="50" x2="81" y2="71" className={clsx('stroke-[0.45]', palette.line)} />
            <line x1="50" y1="50" x2="50" y2="12" className={clsx('stroke-[0.45]', palette.line)} />
            <line x1="50" y1="50" x2="50" y2="88" className={clsx('stroke-[0.45]', palette.line)} />
          </svg>

          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
            transition={{
              duration: 6.5,
              ease: 'easeInOut',
              repeat: Number.POSITIVE_INFINITY,
            }}
            className="absolute left-1/2 top-1/2 w-[68%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/20 bg-slate-950/65 p-3 shadow-[0_30px_70px_-35px_rgba(56,189,248,0.5)] backdrop-blur-xl"
          >
            <div className={clsx('rounded-xl border border-white/15 bg-gradient-to-r px-3 py-2', palette.centerTop)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full border border-white/25 bg-white/10" />
                  <span className="h-2.5 w-20 rounded-full bg-white/25" />
                </div>
                <Bell size={14} className="text-white/80" />
              </div>
            </div>

            <div className={clsx('mt-3 h-20 rounded-xl border border-white/15 bg-gradient-to-br', palette.centerMedia)} />

            <div className="mt-3 flex items-center justify-between">
              <span className="h-2 w-24 rounded-full bg-white/20" />
              <div className="flex items-center gap-2 text-white/75">
                <Heart size={14} />
                <MessageCircleMore size={14} />
                <Share2 size={14} />
              </div>
            </div>
          </motion.div>

          {orbitNodes.map(({ id, Icon, className, delay }) => (
            <motion.div
              key={id}
              className={clsx(
                'absolute grid h-10 w-10 place-items-center rounded-full border shadow-[0_10px_30px_-15px_rgba(56,189,248,0.65)] backdrop-blur-xl',
                className,
                palette.node,
              )}
              animate={reduceMotion ? undefined : { y: [0, -5, 0], scale: [1, 1.04, 1] }}
              transition={{
                duration: 4.2 + delay,
                ease: 'easeInOut',
                repeat: Number.POSITIVE_INFINITY,
                delay,
              }}
            >
              <Icon size={15} />
            </motion.div>
          ))}
        </div>

        <div className="relative mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]">
          <span className={clsx('rounded-full border px-3 py-1', palette.chip)}>Network</span>
          <span className={clsx('rounded-full border px-3 py-1', palette.chip)}>Realtime</span>
          <span className={clsx('rounded-full border px-3 py-1', palette.chip)}>Community</span>
        </div>
      </div>
    </div>
  );
};
