import React, { useState, useEffect } from 'react';
import { Shield, Check, Cookie, ArrowLeft, Info, CheckCircle2, Lock } from 'lucide-react';
import {
  CookiePreferences,
  getCookiePreferences,
  saveCookiePreferences,
  acceptAllCookies
} from '../../services/cookiePreferences';

interface CookiePreferencesProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesProps> = ({
  isOpen = true,
  onClose,
  isStandalonePage = false
}) => {
  const [preferences, setPreferences] = useState<CookiePreferences>(getCookiePreferences);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setPreferences(getCookiePreferences());
  }, [isOpen]);

  const handleSave = () => {
    const updated = saveCookiePreferences(preferences);
    setPreferences(updated);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      if (onClose) onClose();
    }, 1200);
  };

  const handleAcceptAll = () => {
    const updated = acceptAllCookies();
    setPreferences(updated);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      if (onClose) onClose();
    }, 1200);
  };

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      window.location.href = '/';
    }
  };

  const content = (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 max-w-2xl w-full shadow-xl relative text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-[#D97706] rounded-xl shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Cookie & Browser Storage Preferences</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage how NivaranAI stores operational data in your browser.
            </p>
          </div>
        </div>
        {isStandalonePage && (
          <button
            onClick={handleGoBack}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Cookie preferences saved successfully!</span>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {/* Category 1: Essential / Necessary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <strong className="text-sm font-bold text-slate-900 dark:text-white">
                Necessary / Essential Storage
              </strong>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              Always Enabled
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            Required for authenticating user sessions, maintaining role-based access security, CSRF protection, and platform navigation. Cannot be disabled.
          </p>
        </div>

        {/* Category 2: Functional */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#D97706]" />
              <strong className="text-sm font-bold text-slate-900 dark:text-white">
                Functional Storage
              </strong>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-slate-600 peer-checked:bg-[#D97706]"></div>
            </label>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            Saves your light/dark visual theme choice, last requested GPS location coordinates in session cache, and notification UI settings across page visits.
          </p>
        </div>

        {/* Category 3: Analytics Statement */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <strong className="text-sm font-bold text-slate-900 dark:text-white">
                Third-Party Analytics & Tracking
              </strong>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Not Implemented
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            NivaranAI does <strong>NOT</strong> integrate advertising networks, commercial behavioral trackers, or third-party marketing cookies.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        {!isStandalonePage && onClose && (
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition cursor-pointer"
        >
          Save Preferences
        </button>
        <button
          onClick={handleAcceptAll}
          className="w-full sm:w-auto px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
        >
          Accept Functional Storage
        </button>
      </div>
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
        <header className="w-full border-b border-[#D1D5DB] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-900 sticky top-0 z-30 px-4 py-3 shadow-xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleGoBack}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Platform</span>
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
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex items-center justify-center">
          {content}
        </main>

        <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
            <span>© 2026 NivaranAI • Storage & Privacy Settings</span>
            <div className="flex items-center gap-4 text-[11px]">
              <a href="/privacy-policy" className="underline hover:text-slate-800 dark:hover:text-slate-200">Privacy Policy</a>
              <a href="/terms" className="underline hover:text-slate-800 dark:hover:text-slate-200">Terms & Conditions</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      {content}
    </div>
  );
};
