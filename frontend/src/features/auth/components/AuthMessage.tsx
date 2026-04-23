import clsx from 'clsx';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type AuthMessageKind = 'error' | 'success' | 'info' | 'warning';

interface AuthMessageProps {
  kind: AuthMessageKind;
  children: ReactNode;
}

const styleMap: Record<AuthMessageKind, string> = {
  error: 'border-rose-300/45 bg-rose-500/12 text-rose-100',
  success: 'border-emerald-300/40 bg-emerald-500/12 text-emerald-100',
  info: 'border-sky-300/35 bg-sky-500/10 text-sky-100',
  warning: 'border-amber-300/40 bg-amber-500/10 text-amber-100',
};

const iconMap: Record<AuthMessageKind, ReactNode> = {
  error: <AlertTriangle size={16} />,
  success: <CheckCircle2 size={16} />,
  info: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
};

export const AuthMessage = ({ kind, children }: AuthMessageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'inline-flex w-full items-start gap-2 rounded-xl border px-3.5 py-3 text-sm',
        styleMap[kind],
      )}
    >
      <span className="mt-0.5">{iconMap[kind]}</span>
      <span>{children}</span>
    </motion.div>
  );
};
