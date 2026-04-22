interface CornerToastProps {
  message: string | null;
  type?: 'success' | 'error';
}

export const CornerToast = ({ message, type = 'success' }: CornerToastProps) => {
  if (!message) {
    return null;
  }

  const toneClass =
    type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200';

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100]">
      <div
        className={`max-w-xs rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur ${toneClass}`}
      >
        {message}
      </div>
    </div>
  );
};
