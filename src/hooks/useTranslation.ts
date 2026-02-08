import { useAuthStore } from '@/store';
import { UI_TRANSLATIONS } from '@/lib/constants';

export function useTranslation() {
  const { language, setLanguage } = useAuthStore();

  const t = (section: keyof typeof UI_TRANSLATIONS.en, key: string): string => {
    const translations = UI_TRANSLATIONS[language as keyof typeof UI_TRANSLATIONS];
    const sectionData = translations[section] as Record<string, string>;
    return sectionData?.[key] || key;
  };

  return {
    t,
    language,
    setLanguage,
    isSpanish: language === 'es',
    isEnglish: language === 'en',
  };
}
