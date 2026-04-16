interface CountdownOverlayProps {
  countdown: number;
}

export const CountdownOverlay = ({ countdown }: CountdownOverlayProps) => {
  if (countdown <= 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-slate-950/45">
      <div className="rounded-2xl bg-white/95 px-6 py-4 text-center shadow-card dark:bg-slate-900/95">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Starting in</p>
        <p className="text-4xl font-extrabold text-brand-600 dark:text-brand-300">{countdown}</p>
      </div>
    </div>
  );
};

