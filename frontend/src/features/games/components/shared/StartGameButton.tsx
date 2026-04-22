interface StartGameButtonProps {
  disabled: boolean;
  onStart: () => Promise<void> | void;
}

export const StartGameButton = ({ disabled, onStart }: StartGameButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        void onStart();
      }}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
    >
      Start game
    </button>
  );
};

