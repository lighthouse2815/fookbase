interface AuthFormProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  loadingLabel?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const AuthForm = ({
  title,
  subtitle,
  submitLabel,
  loadingLabel = '...',
  onSubmit,
  isSubmitting,
  errorMessage,
  children,
  footer,
}: AuthFormProps) => {
  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        {children}

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? loadingLabel : submitLabel}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">{footer}</div>
    </div>
  );
};
