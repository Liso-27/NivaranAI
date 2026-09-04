import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, KeyRound, Shield } from 'lucide-react';
import { sendPasswordRecovery } from '../../services/appwrite';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReturnToLogin = () => {
    window.location.href = '/';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      // Calls Appwrite POST /account/recovery reusing existing Appwrite config
      const redirectUrl = `${window.location.origin}/reset-password`;
      await sendPasswordRecovery(cleanEmail, redirectUrl);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Password recovery error:', err);
      // For security, present clear guidance without leaking exact account status if Appwrite conceals it
      setErrorMessage(
        err.message || 'Unable to process recovery request. Please verify your internet connection and email address.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-[#D1D5DB] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-900 sticky top-0 z-30 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturnToLogin}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
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
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/50 text-[#D97706] rounded-xl shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Forgot Password
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Appwrite Password Recovery Gateway
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="space-y-5 animate-fade-in text-center py-2">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recovery Email Sent
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  If an account exists for <strong>{email}</strong>, a password reset link has been dispatched. Please check your inbox and spam folder.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your registered account email address below. We will send an official Appwrite password recovery link to reset your credentials.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#D97706] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Password Recovery Link</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  Remembered your password? Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between text-[11px]">
          <span>NivaranAI Authentication Recovery</span>
          <a href="/privacy-policy" className="underline hover:text-slate-800 dark:hover:text-slate-200">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};
