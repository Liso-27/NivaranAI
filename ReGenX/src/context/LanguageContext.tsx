import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, DEFAULT_LANGUAGE, isLanguage } from '../i18n/languages';
import {
  translate,
  setCurrentLanguage,
  formatDateTime,
  formatDate,
  formatTime,
  formatNumber,
} from '../i18n/translate';
import { TranslationKey } from '../i18n/translations/en';
import {
  tHazard,
  tSeverity,
  tSafePlaceType,
  tSafePlaceStatus,
  tRole,
  tOfficialStatus,
  tObservationType,
  tMitigationStatus,
  tVerification,
  tZone,
  tWard,
} from '../i18n/domain';
import { tx } from '../i18n/dynamicText';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  tHazard: (hazard: string) => string;
  tSeverity: (severity: string) => string;
  tSafePlaceType: (type: string) => string;
  tSafePlaceStatus: (status: string) => string;
  tRole: (role: string) => string;
  tOfficialStatus: (status: string) => string;
  tObservationType: (type: string) => string;
  tMitigationStatus: (status: string) => string;
  tVerification: (state: string) => string;
  tZone: (zone: string) => string;
  tWard: (wardId?: number | string | null, fallbackName?: string | null) => string;
  tx: (text: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('nivaran_language');
      if (isLanguage(saved)) {
        return saved;
      }
    } catch {
      // Gracefully handle environments with restricted localStorage
    }
    return DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nivaran_language', language);
    } catch {
      // Gracefully handle storage write limits or restrictions
    }
    setCurrentLanguage(language);
    document.documentElement.lang = language;
    document.title = translate('app.title', undefined, language);
  }, [language]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      return translate(key, vars, language);
    },
    [language]
  );

  const formatDateTimeBound = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatDateTime(date, options, language);
    },
    [language]
  );

  const formatDateBound = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatDate(date, options, language);
    },
    [language]
  );

  const formatTimeBound = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatTime(date, options, language);
    },
    [language]
  );

  const formatNumberBound = useCallback(
    (num: number, options?: Intl.NumberFormatOptions) => {
      return formatNumber(num, options, language);
    },
    [language]
  );

  const tHazardBound = useCallback((hazard: string) => tHazard(hazard, language), [language]);
  const tSeverityBound = useCallback((severity: string) => tSeverity(severity, language), [language]);
  const tSafePlaceTypeBound = useCallback((type: string) => tSafePlaceType(type, language), [language]);
  const tSafePlaceStatusBound = useCallback((status: string) => tSafePlaceStatus(status, language), [language]);
  const tRoleBound = useCallback((role: string) => tRole(role, language), [language]);
  const tOfficialStatusBound = useCallback((status: string) => tOfficialStatus(status, language), [language]);
  const tObservationTypeBound = useCallback((type: string) => tObservationType(type, language), [language]);
  const tMitigationStatusBound = useCallback((status: string) => tMitigationStatus(status, language), [language]);
  const tVerificationBound = useCallback((state: string) => tVerification(state, language), [language]);
  const tZoneBound = useCallback((zone: string) => tZone(zone, language), [language]);
  const tWardBound = useCallback(
    (wardId?: number | string | null, fallbackName?: string | null) =>
      tWard(wardId, fallbackName, language),
    [language]
  );
  const txBound = useCallback((text: string | null | undefined) => tx(text, language), [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      formatDateTime: formatDateTimeBound,
      formatDate: formatDateBound,
      formatTime: formatTimeBound,
      formatNumber: formatNumberBound,
      tHazard: tHazardBound,
      tSeverity: tSeverityBound,
      tSafePlaceType: tSafePlaceTypeBound,
      tSafePlaceStatus: tSafePlaceStatusBound,
      tRole: tRoleBound,
      tOfficialStatus: tOfficialStatusBound,
      tObservationType: tObservationTypeBound,
      tMitigationStatus: tMitigationStatusBound,
      tVerification: tVerificationBound,
      tZone: tZoneBound,
      tWard: tWardBound,
      tx: txBound,
    }),
    [
      language,
      setLanguage,
      t,
      formatDateTimeBound,
      formatDateBound,
      formatTimeBound,
      formatNumberBound,
      tHazardBound,
      tSeverityBound,
      tSafePlaceTypeBound,
      tSafePlaceStatusBound,
      tRoleBound,
      tOfficialStatusBound,
      tObservationTypeBound,
      tMitigationStatusBound,
      tVerificationBound,
      tZoneBound,
      tWardBound,
      txBound,
    ]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

