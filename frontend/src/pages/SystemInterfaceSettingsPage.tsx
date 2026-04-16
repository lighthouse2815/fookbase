import { Check, Languages, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useTheme, type ThemeMode } from '../contexts/ThemeContext';

interface ThemeOption {
  id: ThemeMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface LanguageOption {
  id: 'vi' | 'en';
  label: string;
  description: string;
}

export const SystemInterfaceSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const currentLanguage = (i18n.resolvedLanguage ?? i18n.language).toLowerCase();
  const isVietnamese = currentLanguage.startsWith('vi');

  const copy = isVietnamese
    ? {
        title: 'Giao diện hệ thống',
        subtitle: 'Tùy chỉnh chế độ sáng/tối và ngôn ngữ hiển thị trên ứng dụng.',
        themeTitle: 'Chế độ giao diện',
        themeDescription: 'Chọn kiểu hiển thị bạn muốn dùng.',
        themeSystemLabel: 'Theo hệ thống',
        themeSystemDescription: 'Tự động theo cài đặt sáng/tối của thiết bị.',
        activeStyleLabel: 'Giao diện đang hiển thị:',
        languageTitle: 'Ngôn ngữ',
        languageDescription: 'Chọn ngôn ngữ hiển thị trên toàn bộ ứng dụng.',
        vietnameseDescription: 'Hiển thị tiếng Việt',
        englishDescription: 'Display in English',
      }
    : {
        title: 'System interface',
        subtitle: 'Customize app appearance and display language.',
        themeTitle: 'Appearance mode',
        themeDescription: 'Choose how the interface should look.',
        themeSystemLabel: 'System default',
        themeSystemDescription: 'Follow your device light/dark preference.',
        activeStyleLabel: 'Current appearance:',
        languageTitle: 'Language',
        languageDescription: 'Choose your app display language.',
        vietnameseDescription: 'Display in Vietnamese',
        englishDescription: 'Display in English',
      };

  const themeOptions: ThemeOption[] = [
    {
      id: 'light',
      label: t('theme.light'),
      description: isVietnamese ? 'Nền sáng, chữ tối' : 'Light background with dark text',
      icon: Sun,
    },
    {
      id: 'dark',
      label: t('theme.dark'),
      description: isVietnamese ? 'Nền tối, chữ sáng' : 'Dark background with light text',
      icon: Moon,
    },
    {
      id: 'system',
      label: copy.themeSystemLabel,
      description: copy.themeSystemDescription,
      icon: Monitor,
    },
  ];

  const languageOptions: LanguageOption[] = [
    {
      id: 'vi',
      label: t('language.vietnamese'),
      description: copy.vietnameseDescription,
    },
    {
      id: 'en',
      label: t('language.english'),
      description: copy.englishDescription,
    },
  ];

  return (
    <div className="space-y-4 pb-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <Monitor size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{copy.title}</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{copy.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{copy.themeTitle}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{copy.themeDescription}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/70 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <Icon size={16} />
                    {option.label}
                  </span>
                  {isActive ? <Check size={15} /> : null}
                </div>
                <p className="mt-2 text-xs opacity-80">{option.description}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {copy.activeStyleLabel}{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {resolvedTheme === 'dark' ? t('theme.dark') : t('theme.light')}
          </span>
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
        <div className="flex items-center gap-2">
          <Languages size={17} className="text-slate-500 dark:text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{copy.languageTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{copy.languageDescription}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {languageOptions.map((option) => {
            const isActive = currentLanguage.startsWith(option.id);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (isActive) {
                    return;
                  }

                  void i18n.changeLanguage(option.id);
                }}
                className={`rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/70 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{option.label}</p>
                  {isActive ? <Check size={15} /> : null}
                </div>
                <p className="mt-2 text-xs opacity-80">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
