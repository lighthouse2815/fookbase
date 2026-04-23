import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import type { AuthTone } from '@/features/auth/components/AuthBackground';

interface AuthSubmitButtonProps {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  tone?: AuthTone;
}

const toneClassMap: Record<AuthTone, string> = {
  user: 'from-brand-500 to-sky-500 hover:from-brand-400 hover:to-sky-400',
  register: 'from-indigo-500 to-brand-500 hover:from-indigo-400 hover:to-brand-400',
  recovery: 'from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400',
  admin: 'from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400',
};

export const AuthSubmitButton = ({
  label,
  loadingLabel,
  isLoading,
  tone = 'user',
}: AuthSubmitButtonProps) => {
  return (
    <motion.button
      type="submit"
      whileTap={{ scale: 0.985 }}
      disabled={isLoading}
      className={clsx(
        'inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70',
        toneClassMap[tone],
      )}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </motion.button>
  );
};
