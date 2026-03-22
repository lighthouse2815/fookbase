import clsx from 'clsx';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface InputFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

export const InputField = ({
  label,
  type = 'text',
  placeholder,
  registration,
  error,
  autoComplete,
  rightElement,
}: InputFieldProps) => {
  return (
    <label className="flex w-full flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
      <span className="font-medium">{label}</span>
      <div
        className={clsx(
          'flex items-center overflow-hidden rounded-xl border bg-white transition-colors dark:bg-slate-900',
          error
            ? 'border-rose-400 focus-within:border-rose-500'
            : 'border-slate-200 focus-within:border-brand-500 dark:border-slate-700',
        )}
      >
        <input
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          {...registration}
        />
        {rightElement ? <div className="pr-3">{rightElement}</div> : null}
      </div>
      {error ? <span className="text-xs text-rose-500">{error}</span> : null}
    </label>
  );
};

