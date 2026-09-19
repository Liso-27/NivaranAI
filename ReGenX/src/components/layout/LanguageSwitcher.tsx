import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES, getLanguageInfo } from '../../i18n/languages';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentInfo = getLanguageInfo(language);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('language.change')}
        title={t('language.change')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition duration-150 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold"
      >
        <Languages className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
        <span className="text-[11px] font-bold tracking-tight">{currentInfo.shortLabel}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('language.select')}
          className="absolute right-0 mt-1.5 w-36 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 animate-fade-in"
        >
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-[#0B3D91] dark:text-[#F58220] font-bold bg-slate-50 dark:bg-slate-800/60'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <span>{lang.nativeName}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#0B3D91] dark:text-[#F58220] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
