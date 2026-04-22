import { ShieldCheck } from 'lucide-react';
import type { TFunction } from 'i18next';

interface SecuritySettingsHeaderProps {
  t: TFunction;
}

export const SecuritySettingsHeader = ({ t }: SecuritySettingsHeaderProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('securitySettings.title')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('securitySettings.subtitle')}
          </p>
        </div>
      </div>
    </section>
  );
};
