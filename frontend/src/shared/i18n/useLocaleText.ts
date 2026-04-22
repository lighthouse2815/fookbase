import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const useLocaleText = () => {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const isEnglish = language.toLowerCase().startsWith('en');

  return useMemo(
    () => (vi: string, en: string) => (isEnglish ? en : vi),
    [isEnglish],
  );
};

