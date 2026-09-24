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
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#334155] rounded-lg transition duration-150 cursor-pointer text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706]"
      >
        <Languages className="w-4 h-4 text-slate-700 dark:text-slate-200 shrink-0" />
        <span className="text-[11px] font-semibold tracking-tight">{currentInfo.shortLabel}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('language.select')}
          className="absolute right-0 mt-1.5 w-36 py-1 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-lg shadow-lg z-50 animate-fade-in"
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
                    ? 'text-[#D97706] font-bold bg-amber-50 dark:bg-[#0F172A]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#334155]/50'
                }`}
              >
                <span>{lang.nativeName}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
