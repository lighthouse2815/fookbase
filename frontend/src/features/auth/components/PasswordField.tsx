import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

import { AuthInput } from '@/features/auth/components/AuthInput';
import type { AuthInputProps } from '@/features/auth/components/AuthInput';

interface PasswordFieldProps extends Omit<AuthInputProps, 'type' | 'rightElement'> {
  showPassword: boolean;
  onToggleVisibility: () => void;
  showLabel: string;
  hideLabel: string;
}

export const PasswordField = ({
  showPassword,
  onToggleVisibility,
  showLabel,
  hideLabel,
  ...inputProps
}: PasswordFieldProps) => {
  return (
    <AuthInput
      {...inputProps}
      type={showPassword ? 'text' : 'password'}
      rightElement={
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
          onClick={onToggleVisibility}
          aria-label={showPassword ? hideLabel : showLabel}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </motion.button>
      }
    />
  );
};
