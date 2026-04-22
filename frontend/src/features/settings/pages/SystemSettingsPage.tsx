import { Languages, Palette, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ThemeMode } from '@/shared/contexts/ThemeContext';
import { useTheme } from '@/shared/contexts/ThemeContext';

export const SystemSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language;
  const normalizedLanguage = currentLanguage.startsWith('vi') ? 'vi' : 'en';

  const themeOptions = useMemo(
    () => [
      {
        id: 'light' as ThemeMode,
        label: t('theme.light'),
        description: t('systemSettings.themeOptions.light'),
      },
      {
        id: 'dark' as ThemeMode,
        label: t('theme.dark'),
        description: t('systemSettings.themeOptions.dark'),
      },
      {
        id: 'system' as ThemeMode,
        label: t('systemSettings.themeSystem'),
        description: t('systemSettings.themeOptions.system'),
      },
    ],
    [t],
  );

  const languageOptions = useMemo(
    () => [
      {
        id: 'vi',
        label: t('language.vietnamese'),
        description: t('systemSettings.languageOptions.vietnamese'),
      },
      {
        id: 'en',
        label: t('language.english'),
        description: t('systemSettings.languageOptions.english'),
      },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('systemSettings.title')}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('systemSettings.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-center gap-2">
          <Palette size={18} className="text-brand-600 dark:text-brand-300" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('systemSettings.themeTitle')}
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('systemSettings.themeDescription')}</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {themeOptions.map((option) => {
            const isActive = theme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/70 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-xs opacity-80">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-center gap-2">
          <Languages size={18} className="text-brand-600 dark:text-brand-300" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('systemSettings.languageTitle')}
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('systemSettings.languageDescription')}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {languageOptions.map((option) => {
            const isActive = normalizedLanguage === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  void i18n.changeLanguage(option.id);
                }}
                className={`rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/70 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="mt-1 text-xs opacity-80">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

