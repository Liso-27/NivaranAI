export type Language = 'en' | 'hi' | 'or';

export interface LanguageInfo {
  code: Language;
  nativeName: string;
  shortLabel: string;
  locale: string;
}

export const LANGUAGES: readonly LanguageInfo[] = [
  {
    code: 'en',
    nativeName: 'English',
    shortLabel: 'EN',
    locale: 'en-IN',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    shortLabel: 'हि',
    locale: 'hi-IN',
  },
  {
    code: 'or',
    nativeName: 'ଓଡ଼ିଆ',
    shortLabel: 'ଓ',
    locale: 'or-IN',
  },
] as const;

export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'hi' || value === 'or';
}

export function getLanguageInfo(lang: Language): LanguageInfo {
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
}
