import clsx from 'clsx';
import type { HTMLInputTypeAttribute, ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

import type { AuthTone } from '@/features/auth/components/AuthBackground';

interface AuthInputProps {
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete?: string;
  rightElement?: ReactNode;
  tone?: AuthTone;
}

const toneFocusMap: Record<AuthTone, string> = {
  user: 'focus-within:border-brand-300 focus-within:shadow-[0_0_0_4px_rgba(31,109,226,0.2)]',
  register: 'focus-within:border-indigo-300 focus-within:shadow-[0_0_0_4px_rgba(99,102,241,0.22)]',
  recovery: 'focus-within:border-teal-300 focus-within:shadow-[0_0_0_4px_rgba(13,148,136,0.23)]',
  admin: 'focus-within:border-rose-300 focus-within:shadow-[0_0_0_4px_rgba(244,63,94,0.2)]',
};

export const AuthInput = ({
  label,
  type = 'text',
  placeholder,
  registration,
  error,
  autoComplete,
  rightElement,
  tone = 'user',
}: AuthInputProps) => {
  return (
    <label className="block text-sm">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200/75">
        {label}
      </span>
      <div
        className={clsx(
          'group flex items-center rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-xl transition-all duration-300',
          toneFocusMap[tone],
          error
            ? 'border-rose-300/60 shadow-[0_0_0_4px_rgba(244,63,94,0.18)]'
            : 'hover:border-white/35',
        )}
      >
        <input
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-slate-400/75 focus:outline-none"
          {...registration}
        />
        {rightElement ? <div className="pr-3">{rightElement}</div> : null}
      </div>
      {error ? (
        <motion.span
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-rose-200"
          role="alert"
        >
          <AlertCircle size={13} />
          {error}
        </motion.span>
      ) : null}
    </label>
  );
};

export type { AuthInputProps };
