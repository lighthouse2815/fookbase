import { MessageSquareText } from 'lucide-react';

export const MessagesPage = () => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          <MessageSquareText size={22} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tin nhan</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Khu vuc tin nhan se duoc bo sung o buoc tiep theo.
        </p>
      </div>
    </section>
  );
};
