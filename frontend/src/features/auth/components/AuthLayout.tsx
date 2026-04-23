import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { AuthBackground } from '@/features/auth/components/AuthBackground';
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-4 pb-7 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:flex-row lg:items-center lg:gap-14 lg:px-10 lg:py-10">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 w-full lg:mb-0 lg:w-[46%]"
        >
          <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
            {eyebrow}
          </span>
          <h1 className="mt-4 max-w-[16ch] text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-slate-200/80 sm:text-base">
            {description}
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm text-slate-200/80 sm:max-w-xl sm:grid-cols-2">
            {highlights.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-md"
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className="w-full lg:w-[54%]"
        >
          {children}
        </motion.section>
      </div>
    </div>
  );
};
