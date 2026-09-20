import { Language, DEFAULT_LANGUAGE } from './languages';
import { en, TranslationKey } from './translations/en';
import { hi } from './translations/hi';
import { or } from './translations/or';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en,
  hi,
  or,
};

let currentLanguage: Language = DEFAULT_LANGUAGE;

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setCurrentLanguage(lang: Language): void {
  currentLanguage = lang;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in vars && vars[key] !== undefined && vars[key] !== null) {
      return String(vars[key]);
    }
    return match;
  });
}

export function translate(
  key: TranslationKey,
  vars?: Record<string, string | number>,
  lang?: Language
): string {
  const targetLang = lang ?? currentLanguage;
  const dict = TRANSLATIONS[targetLang];
  let template = dict ? dict[key] : undefined;

  // Fallback to English
  if (template === undefined && targetLang !== 'en') {
    template = TRANSLATIONS.en[key];
  }

  // Fallback to key itself
  if (template === undefined) {
    template = key;
  }

  return interpolate(template, vars);
}

export const t = translate;

// Map each language to Indian locale with Western/Latin numerals forced via -u-nu-latn
const LOCALE_LATIN_MAP: Record<Language, string> = {
  en: 'en-IN-u-nu-latn',
  hi: 'hi-IN-u-nu-latn',
  or: 'or-IN-u-nu-latn',
};

export function getLocale(lang?: Language): string {
  const l = lang ?? currentLanguage;
  return LOCALE_LATIN_MAP[l] ?? LOCALE_LATIN_MAP[DEFAULT_LANGUAGE];
}

export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  lang?: Language
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const locale = getLocale(lang);
  const opts: Intl.DateTimeFormatOptions = options ?? {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  lang?: Language
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const locale = getLocale(lang);
  const opts: Intl.DateTimeFormatOptions = options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

export function formatTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  lang?: Language
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const locale = getLocale(lang);
  const opts: Intl.DateTimeFormatOptions = options ?? {
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

export function formatNumber(
  num: number,
  options?: Intl.NumberFormatOptions,
  lang?: Language
): string {
  if (typeof num !== 'number' || isNaN(num)) return String(num);
  const locale = getLocale(lang);
  return new Intl.NumberFormat(locale, options).format(num);
}
