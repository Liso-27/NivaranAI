import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const TermsPage: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleGoBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Navigation Header */}
      <header className="w-full border-b border-[#D1D5DB] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-900 sticky top-0 z-30 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              aria-label={t('legal.returnToPlatformAria')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('legal.backToPlatform')}</span>
            </button>
            <div className="h-5 w-px bg-slate-300 dark:bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <img
                src="/nivaran-logo.png"
                alt="NivaranAI Logo"
                className="w-7 h-7 object-contain rounded-full bg-white p-0.5 shadow-2xs"
              />
              <span className="text-base font-bold text-slate-900 dark:text-white">
                Nivaran<span className="text-[#D97706]">AI</span>
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#D97706]" />
            {t('auth.termsConditions')}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Document Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-[#D97706]" />
            {t('legal.termsBadge')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('legal.termsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('legal.termsEffectiveDate')}
          </p>

          {/* Mandatory Emergency Banner */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-lg text-rose-900 dark:text-rose-200 text-xs leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">{t('legal.mandatoryEmergencyDisclaimer')}</strong> {t('legal.termsDisclaimerPart1')} <strong className="font-bold">{t('legal.termsDisclaimerPart2')}</strong>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">1</span>
              {t('legal.termsSec1Title')}
            </h2>
            <p>
              {t('legal.termsSec1P1')}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">2</span>
              {t('legal.termsSec2Title')}
            </h2>
            <p>
              {t('legal.termsSec2Intro')}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-amber-500">
              <li>{t('legal.termsSec2Item1')}</li>
              <li>{t('legal.termsSec2Item2')}</li>
              <li>{t('legal.termsSec2Item3')}</li>
              <li>{t('legal.termsSec2Item4')}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">3</span>
              {t('legal.termsSec3Title')}
            </h2>
            <p>
              {t('legal.termsSec3Intro')}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-amber-500">
              <li>{t('legal.termsSec3Item1')}</li>
              <li>{t('legal.termsSec3Item2')}</li>
              <li>{t('legal.termsSec3Item3')}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">4</span>
              {t('legal.termsSec4Title')}
            </h2>
            <p>
              {t('legal.termsSec4P1')}
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">5</span>
              {t('legal.termsSec5Title')}
            </h2>
            <p>
              {t('legal.termsSec5P1')}
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">6</span>
              {t('legal.termsSec6Title')}
            </h2>
            <p>
              {t('legal.termsSec6P1')}
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">7</span>
              {t('legal.termsSec7Title')}
            </h2>
            <p>
              {t('legal.termsSec7P1')}
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
              <div><strong>{t('legal.legalDepartmentContactLabel')}</strong> {t('legal.contactPlaceholderLegalEmail')}</div>
              <div><strong>{t('legal.systemAdministrationLabel')}</strong> support@nivaran.ai • +91 674 243 0001</div>
              <div><strong>{t('legal.jurisdictionLabel')}</strong> {t('legal.jurisdictionValue')}</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t('legal.termsFooterCopyright')}</span>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="/privacy-policy" className="hover:text-slate-800 dark:hover:text-slate-200 underline">{t('auth.privacyPolicy')}</a>
            <a href="/cookie-preferences" className="hover:text-slate-800 dark:hover:text-slate-200 underline">{t('auth.cookiePreferences')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
