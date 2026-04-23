import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import {
  AUTH_FORM_SHELL_VARIANTS,
  AUTH_HERO_LINE_VARIANTS,
  AUTH_HERO_STAGGER_VARIANTS,
} from '@/features/auth/animations/authMotion';
import { AuthBackground } from '@/features/auth/components/AuthBackground';
import { CherryBlossomFall } from '@/features/auth/components/CherryBlossomFall';
import type { AuthTone } from '@/features/auth/components/AuthBackground';

interface AuthLayoutProps {
  tone?: AuthTone;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  children: ReactNode;
}

export const AuthLayout = ({
  tone = 'user',
  eyebrow,
  title,
  description,
  highlights,
  children,
}: AuthLayoutProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <AuthBackground tone={tone} />
      <CherryBlossomFall />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-7 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:flex-row lg:items-center lg:gap-14 lg:px-10 lg:py-10">
        <motion.section
          variants={reduceMotion ? undefined : AUTH_HERO_STAGGER_VARIANTS}
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? undefined : 'visible'}
          className="mb-6 w-full lg:mb-0 lg:w-[46%]"
        >
          <motion.span
            variants={reduceMotion ? undefined : AUTH_HERO_LINE_VARIANTS}
            className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75"
          >
            {eyebrow}
          </motion.span>
          <motion.h1
            variants={reduceMotion ? undefined : AUTH_HERO_LINE_VARIANTS}
            className="mt-4 max-w-[16ch] text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl"
          >
            {title}
          </motion.h1>
          <motion.p
            variants={reduceMotion ? undefined : AUTH_HERO_LINE_VARIANTS}
            className="mt-4 max-w-[44ch] text-sm leading-relaxed text-slate-200/80 sm:text-base"
          >
            {description}
          </motion.p>
          <ul className="mt-6 grid gap-2.5 text-sm text-slate-200/80 sm:max-w-xl sm:grid-cols-2">
            {highlights.map((item) => (
              <motion.li
                key={item}
                variants={reduceMotion ? undefined : AUTH_HERO_LINE_VARIANTS}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-md"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          variants={reduceMotion ? undefined : AUTH_FORM_SHELL_VARIANTS}
          initial={reduceMotion ? false : 'hidden'}
          animate={reduceMotion ? undefined : 'visible'}
          className="w-full lg:w-[54%]"
        >
          {children}
        </motion.section>
      </div>
    </div>
  );
};
