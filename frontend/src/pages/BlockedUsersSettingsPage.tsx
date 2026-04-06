import { Ban, ShieldAlert } from 'lucide-react';

export const BlockedUsersSettingsPage = () => {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
            <Ban size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Danh sach chan</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Quan ly nhung tai khoan ban da chan.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <ShieldAlert size={24} />
        </div>
        <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">Ban chua chan tai khoan nao</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Khi tinh nang dong bo danh sach chan san sang, cac tai khoan da chan se hien thi tai day.
        </p>
      </section>
    </div>
  );
};

