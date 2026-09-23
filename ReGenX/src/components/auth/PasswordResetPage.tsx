import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { completePasswordReset } from '../../services/appwrite';
import { useLanguage } from '../../context/LanguageContext';

export const PasswordResetPage: React.FC = () => {
  const { t, tx } = useLanguage();
  const [userId, setUserId] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLinkInvalid, setIsLinkInvalid] = useState(false);

  useEffect(() => {
    // Extract userId and secret from URL search params (?userId=...&secret=...)
    const params = new URLSearchParams(window.location.search);
    const uId = params.get('userId');
    const sec = params.get('secret');

    if (uId) setUserId(uId);
    if (sec) setSecret(sec);

    if (!uId || !sec) {
      setIsLinkInvalid(true);
      setErrorMessage(t('auth.errInvalidLinkParams'));
    }
  }, [t]);

  const handleReturnToLogin = () => {
    window.location.href = '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isLinkInvalid || !userId || !secret) {
      setErrorMessage(t('auth.errInvalidExpiredLink'));
      return;
    }

    if (password.length < 8) {
      setErrorMessage(t('auth.errPasswordMinLength'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('auth.errPasswordsDoNotMatch'));
      return;
    }

    setIsLoading(true);
    try {
      // Calls Appwrite PUT /account/recovery reusing existing Appwrite config
      await completePasswordReset(userId, secret, password);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset completion error:', err);
      setErrorMessage(
        err.message ? tx(err.message) : t('auth.errResetFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Navigation Header */}
      <header className="w-full border-b border-[#D1D5DB] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-900 sticky top-0 z-30 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturnToLogin}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('auth.backToLogin')}</span>
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

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 w-full shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('auth.resetAccountPasswordTitle')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('auth.resetAccountPasswordSubtitle')}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{tx(errorMessage)}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-5 animate-fade-in text-center py-2">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('auth.passwordResetSuccessTitle')}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {t('auth.passwordResetSuccessDesc')}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{t('auth.proceedToSignIn')}</span>
                </button>
              </div>
            </div>
          ) : isLinkInvalid ? (
            <div className="space-y-4 text-center py-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('auth.invalidLinkDesc')}
              </p>
              <a
                href="/forgot-password"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold text-xs transition shadow-xs"
              >
                <span>{t('auth.requestNewRecoveryLink')}</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.newPasswordMinLength')}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.confirmNewPassword')}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showConfirmPassword ? t('auth.hideConfirmPassword') : t('auth.showConfirmPassword')}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('auth.resetPasswordSubmit')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between text-[11px]">
          <span>{t('auth.passwordManagementFooter')}</span>
          <a href="/terms" className="underline hover:text-slate-800 dark:hover:text-slate-200">{t('auth.termsOfService')}</a>
        </div>
      </footer>
    </div>
  );
};
