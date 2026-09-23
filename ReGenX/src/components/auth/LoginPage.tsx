import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import {
  Shield,
  Radio,
  Users,
  Building2,
  Lock,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Loader2,
  Info,
  KeyRound,
  FileCheck,
  Check,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

type AuthStep = 'ROLE_GATE' | 'ADMIN_LOGIN' | 'NON_ADMIN_SELECTION' | 'CITIZEN_AUTH' | 'GOV_LOGIN';

export const LoginPage: React.FC = () => {
  const {
    login,
    registerCitizen,
    registerOfficial,
    isLoading
  } = useAuth();

  const { theme, toggleTheme } = useTheme();
  const { t, tx } = useLanguage();

  // Step Navigation State (Role Gate -> Admin Login or Non-Admin Selection)
  const [authStep, setAuthStep] = useState<AuthStep>('ROLE_GATE');

  // Role Selection State
  const [selectedRole, setSelectedRole] = useState<UserRole>('CITIZEN');

  // Auth Tab State
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Phone OTP Flow State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);

  // Citizen Email/Password Sign In State
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [showCitizenPassword, setShowCitizenPassword] = useState(false);

  // Citizen Sign Up State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('api_admin@apadasathi.gov.in');
  const [adminPassword, setAdminPassword] = useState('AdminPassword123!');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Government Official Login State
  const [officialEmail, setOfficialEmail] = useState('api_official@bmc.gov.in');
  const [officialPassword, setOfficialPassword] = useState('OfficialPassword123!');
  const [showOfficialPassword, setShowOfficialPassword] = useState(false);

  // Official Authorization Modal State
  const [isAuthRequestOpen, setIsAuthRequestOpen] = useState(false);
  const [officialForm, setOfficialForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'BMC Disaster Response Cell',
    designation: 'Executive Engineer',
    idNumber: ''
  });
  const [authRequestSubmitted, setAuthRequestSubmitted] = useState(false);

  // Feedback / Error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs for 6-digit OTP inputs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Clear states when role, step, or tab changes
  useEffect(() => {
    setIsOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResendTimer(0);
  }, [selectedRole, authStep, authTab]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto focus first OTP input when sent
  useEffect(() => {
    if (isOtpSent && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [isOtpSent]);

  // Format phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(raw);
    setErrorMessage(null);
  };

  // Trigger Send Phone OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (phoneNumber.length < 10) {
      setErrorMessage(t('auth.errValidMobile'));
      return;
    }

    try {
      setIsOtpSent(true);
      setResendTimer(30);
      setSuccessMessage(t('auth.successOtpSent', { phoneNumber }));
    } catch {
      setErrorMessage(t('auth.errSendingOtp'));
    }
  };

  // Handle OTP digit changes
  const handleOtpDigitChange = (index: number, value: string) => {
    const val = value.slice(-1).replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);
    setErrorMessage(null);

    if (val && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6 && otpInputRefs.current[5]) {
        otpInputRefs.current[5]?.focus();
      }
    }
  };

  // Quick autofill demo OTP
  const handleAutofillDemoOtp = () => {
    setOtpDigits(['1', '2', '3', '4', '5', '6']);
  };

  // Verify Phone OTP & Log in
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setErrorMessage(t('auth.errCompleteOtp'));
      return;
    }

    try {
      if (authTab === 'SIGN_UP' && selectedRole === 'CITIZEN') {
        if (!fullName.trim()) {
          setErrorMessage(t('auth.errFullNameReq'));
          return;
        }
        await registerCitizen({
          name: fullName.trim(),
          email: email.trim() || `citizen.${phoneNumber.slice(-4)}@nirvana.ai`,
          phone_number: `+91 ${phoneNumber}`,
          notification_sms_enabled: smsOptIn
        });
      } else {
        await login(phoneNumber, fullOtp, selectedRole);
      }
    } catch {
      setErrorMessage(t('auth.errVerificationFailed'));
    }
  };



  // Citizen Email/Password Login Handler
  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!citizenEmail.trim()) {
      setErrorMessage(t('auth.errEmailReq'));
      return;
    }
    if (!citizenPassword) {
      setErrorMessage(t('auth.errPasswordReq'));
      return;
    }
    try {
      await login(citizenEmail.trim(), citizenPassword, 'CITIZEN');
    } catch {
      setErrorMessage(t('auth.errCitizenSignIn'));
    }
  };

  // Admin Email/Password Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login(adminEmail, adminPassword, 'SYSTEM_ADMIN');
    } catch {
      setErrorMessage(t('auth.errAdminLogin'));
    }
  };

  // Government Official Email/Password Login Handler
  const handleOfficialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!officialEmail.trim()) {
      setErrorMessage(t('auth.errGovEmailReq'));
      return;
    }
    if (!officialPassword) {
      setErrorMessage(t('auth.errPasswordReq'));
      return;
    }
    try {
      await login(officialEmail.trim(), officialPassword, 'GOVERNMENT_OFFICIAL');
    } catch {
      setErrorMessage(t('auth.errOfficialSignIn'));
    }
  };

  // Submit Official Authorization Request
  const handleSubmitAuthRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialForm.name || !officialForm.email || !officialForm.phone) {
      setErrorMessage(t('auth.errFillRequiredDetails'));
      return;
    }

    try {
      await registerOfficial({
        name: officialForm.name,
        email: officialForm.email,
        phone_number: officialForm.phone,
        department: officialForm.department,
        designation: officialForm.designation,
        employee_id: officialForm.idNumber || 'EMP-TEMP'
      });
      setAuthRequestSubmitted(true);
      setTimeout(() => {
        setIsAuthRequestOpen(false);
        setAuthRequestSubmitted(false);
        setOfficialForm({
          name: '',
          email: '',
          phone: '',
          department: 'BMC Disaster Response Cell',
          designation: 'Executive Engineer',
          idNumber: ''
        });
        setSuccessMessage(t('auth.successAuthSubmitted'));
      }, 2200);
    } catch {
      setErrorMessage(t('auth.errSubmitAuth'));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 flex flex-col justify-between transition-colors duration-200 overflow-y-auto">
      {/* Top Floating Branding Bar */}
      <header className="w-full border-b border-[#D1D5DB] dark:border-slate-800 bg-[#FFFFFF] dark:bg-slate-950 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/nivaran-logo.png"
              alt="NivaranAI Logo"
              className="w-9 h-9 object-contain rounded-full bg-white p-0.5 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#0F172A] dark:text-white">
                  Nivaran<span className="text-[#D97706]">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F8F9FA] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 text-[#0F172A] dark:text-slate-300">
                  <Radio className="w-2.5 h-2.5 text-emerald-500" />
                  {t('auth.riskGridActive')}
                </span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-slate-400 font-medium hidden md:block">
                {t('auth.bmcSubheading')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 bg-[#F8F9FA] hover:bg-[#E2E8F0] dark:bg-slate-900 dark:hover:bg-slate-800 text-[#0F172A] dark:text-slate-300 border border-[#D1D5DB] dark:border-slate-800 rounded-lg transition duration-150 cursor-pointer"
              title={theme === 'light' ? t('auth.switchDark') : t('auth.switchLight')}
              aria-label={t('auth.toggleTheme')}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-[#0F172A]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Hero & Emergency System Overview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#059669]/10 border border-[#059669]/30 text-xs font-semibold text-[#059669] dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-[#059669]" />
            {t('auth.platformPortal')}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight leading-tight">
              Nivaran <span className="text-[#D97706]">AI</span>
            </h1>
            <p className="text-sm font-semibold text-[#475569] dark:text-slate-300 leading-normal">
              {t('auth.platformSubtitle')}
            </p>
          </div>

          <p className="text-xs text-[#475569] dark:text-slate-400 leading-normal">
            {t('auth.platformDesc')}
          </p>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800">
              <div className="text-lg font-bold text-[#0F172A] dark:text-white">67</div>
              <div className="text-[11px] font-medium text-[#475569] dark:text-slate-400">{t('auth.bmcWards')}</div>
            </div>
            <div className="p-3 bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800">
              <div className="text-lg font-bold text-[#D97706]">{t('auth.syncDuration')}</div>
              <div className="text-[11px] font-medium text-[#475569] dark:text-slate-400">{t('auth.syncCycle')}</div>
            </div>
            <div className="p-3 bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800">
              <div className="text-lg font-bold text-[#059669]">100%</div>
              <div className="text-[11px] font-medium text-[#475569] dark:text-slate-400">{t('auth.verifiedCamps')}</div>
            </div>
          </div>

          {/* Security & Regulatory Footnote */}
          <div className="p-3 bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800 flex items-center gap-3 text-xs text-[#475569] dark:text-slate-400">
            <div className="p-1.5 bg-[#D97706]/10 text-[#D97706] rounded shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <span className="font-medium">
              {t('auth.securityFootnote')}
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Role Selection & Authentication Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: ROLE GATE ("Are you a System Admin?") */}
          {/* ========================================================================= */}
          {authStep === 'ROLE_GATE' && (
            <div className="bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800/80 shadow-xl p-6 sm:p-8 space-y-6 transition-all duration-200">
              {/* Header / Welcome Prompt */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F9F7F3] dark:bg-slate-800 text-[11px] font-bold text-[#66736F] dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-[#8A9A86] dark:text-[#B86B52]" />
                  <span>{t('auth.identityGateway')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading text-[#2F3E46] dark:text-white">
                  {t('auth.areYouAdmin')}
                </h2>
                <p className="text-xs sm:text-sm text-[#66736F] dark:text-slate-400 font-medium">
                  {t('auth.selectRoleCategory')}
                </p>
              </div>

              {/* Two Option Buttons / Cards */}
              <div className="space-y-3.5 pt-2">
                {/* Option 1: Yes, I'm a System Admin */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('SYSTEM_ADMIN');
                    setAuthTab('SIGN_IN');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('ADMIN_LOGIN');
                  }}
                  className="w-full text-left p-4.5 sm:p-5 rounded-lg border border-[#D9D6CF] dark:border-slate-800 bg-[#F9F7F3] hover:bg-[#C53030]/10 dark:bg-slate-950/60 dark:hover:bg-rose-950/30 hover:border-[#C53030] dark:hover:border-rose-500/80 hover:ring-2 hover:ring-[#C53030]/20 transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-2xs hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#C53030]/10 text-[#C53030] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black font-heading text-[#2F3E46] dark:text-white group-hover:text-[#C53030] transition-colors">
                          {t('auth.yesAdmin')}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C53030]/10 text-[#C53030]">
                          {t('auth.restricted')}
                        </span>
                      </div>
                      <p className="text-xs text-[#66736F] dark:text-slate-400 mt-1">
                        {t('auth.adminCardDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#D9D6CF]/60 dark:bg-slate-800 text-[#66736F] group-hover:bg-[#C53030] group-hover:text-white transition-all duration-200 shrink-0 ml-2">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Option 2: No, I'm not a System Admin */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('CITIZEN');
                    setAuthTab('SIGN_IN');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('NON_ADMIN_SELECTION');
                  }}
                  className="w-full text-left p-4.5 sm:p-5 rounded-lg border border-[#D9D6CF] dark:border-slate-800 bg-[#F9F7F3] hover:bg-[#8A9A86]/10 dark:bg-slate-950/60 dark:hover:bg-emerald-950/30 hover:border-[#8A9A86] dark:hover:border-emerald-500/80 hover:ring-2 hover:ring-[#8A9A86]/20 transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-2xs hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#8A9A86]/10 text-[#8A9A86] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black font-heading text-[#2F3E46] dark:text-white group-hover:text-[#8A9A86] transition-colors">
                          {t('auth.noAdmin')}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#8A9A86]/10 text-[#8A9A86]">
                          {t('auth.citizensAndOfficials')}
                        </span>
                      </div>
                      <p className="text-xs text-[#66736F] dark:text-slate-400 mt-1">
                        {t('auth.nonAdminCardDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#D9D6CF]/60 dark:bg-slate-800 text-[#66736F] group-hover:bg-[#8A9A86] group-hover:text-white transition-all duration-200 shrink-0 ml-2">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Security Note */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('auth.roleSelectionProtocol')}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2A: SYSTEM ADMIN LOGIN FLOW */}
          {/* ========================================================================= */}
          {authStep === 'ADMIN_LOGIN' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-xl p-6 sm:p-8 space-y-6 transition-all duration-200">
              {/* Back button + Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('ROLE_GATE');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth.backToRoleSelection')}</span>
                </button>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {t('auth.systemAdminPortal')}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-600" />
                  <span>{t('auth.adminSignInTitle')}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t('auth.adminSignInDesc')}
                </p>
              </div>

              {/* Error / Success Toast Feedback */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{tx(errorMessage)}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium">{tx(successMessage)}</span>
                </div>
              )}

              {/* Sign In / Sign Up Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthTab('SIGN_IN')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition duration-150 cursor-pointer ${authTab === 'SIGN_IN'
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  {t('auth.signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('SIGN_UP')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition duration-150 cursor-pointer ${authTab === 'SIGN_UP'
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  {t('auth.signUp')}
                </button>
              </div>

              {/* System Admin Form / Notice */}
              <div className="space-y-4">
                {authTab === 'SIGN_IN' && (
                  <form onSubmit={handleAdminLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('auth.adminEmail')}
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="admin.disaster@bmc.gov.in"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {t('auth.passwordKey')}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showAdminPassword ? 'text' : 'password'}
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* System Admin Preset */}
                    <div className="pt-2">
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                        <div className="flex items-center justify-between font-bold">
                          <span>{t('auth.sysAdminQuickAccess')}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminEmail('api_admin@apadasathi.gov.in');
                              setAdminPassword('AdminPassword123!');
                            }}
                            className="text-[11px] underline hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer font-bold"
                          >
                            {t('auth.fillCredentials')}
                          </button>
                        </div>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300">
                          {t('auth.sysAdminSavedCredentialsDesc')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>{t('auth.signIn')}</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                      {t('auth.adminAccessFooter')}
                    </p>
                  </form>
                )}

                {/* SIGN UP TAB: Restricted Administrator Notice */}
                {authTab === 'SIGN_UP' && (
                  <div className="space-y-3 text-center p-5 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 rounded-xl">
                    <div className="w-12 h-12 mx-auto bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black font-heading text-rose-800 dark:text-rose-300">
                      {t('auth.adminRestrictedTitle')}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t('auth.adminRestrictedDesc')}
                    </p>
                    <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {t('auth.supportContact')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: NON-SYSTEM-ADMIN ROLE SELECTION (Citizen vs Government Official) */}
          {/* ========================================================================= */}
          {authStep === 'NON_ADMIN_SELECTION' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-xl p-6 sm:p-8 space-y-6 transition-all duration-200">
              {/* Back button + Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('ROLE_GATE');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth.backToAdminCheck')}</span>
                </button>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0B3D91] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {t('auth.selectUserType')}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white">
                  {t('auth.chooseAccessRole')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t('auth.chooseRoleDesc')}
                </p>
              </div>

              {/* Exactly Two Role Selection Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 1. Citizen Option Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('CITIZEN');
                    setAuthTab('SIGN_IN');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('CITIZEN_AUTH');
                  }}
                  className="text-left p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-emerald-50/70 dark:bg-slate-950/60 dark:hover:bg-emerald-950/30 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:ring-2 hover:ring-emerald-500/20 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black font-heading text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {t('auth.citizenRoleTitle')}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        {t('auth.publicAccess')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-3">
                      {t('auth.citizenRoleDesc')}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span>{t('auth.continueAsCitizen')}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>

                {/* 2. Government Official Option Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('GOVERNMENT_OFFICIAL');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('GOV_LOGIN');
                  }}
                  className="text-left p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-amber-50/70 dark:bg-slate-950/60 dark:hover:bg-amber-950/30 hover:border-[#F58220] dark:hover:border-[#F58220]/80 hover:ring-2 hover:ring-[#F58220]/20 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-[#F58220] flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black font-heading text-slate-900 dark:text-white group-hover:text-[#F58220] transition-colors">
                        {t('auth.govRoleTitle')}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                        {t('auth.authorized')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 line-clamp-3">
                      {t('auth.govRoleDesc')}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                    <span>{t('auth.continueToOfficialSignIn')}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Security Footnote */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('auth.roleSelectionProtocol')}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3A: CITIZEN AUTHENTICATION FLOW */}
          {/* ========================================================================= */}
          {authStep === 'CITIZEN_AUTH' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-xl p-6 sm:p-8 space-y-6 transition-all duration-200">
              {/* Back button + Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('NON_ADMIN_SELECTION');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth.backToRoleSelection')}</span>
                </button>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {t('auth.citizenPortal')}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>{t('auth.citizenAuthTitle')}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t('auth.citizenAuthDesc')}
                </p>
              </div>

              {/* Error / Success Toast Feedback */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{tx(errorMessage)}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium">{tx(successMessage)}</span>
                </div>
              )}

              {/* Sign In / Sign Up Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuthTab('SIGN_IN')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition duration-150 cursor-pointer ${authTab === 'SIGN_IN'
                      ? 'border-[#0B3D91] dark:border-[#F58220] text-[#0B3D91] dark:text-[#F58220]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  {t('auth.signIn')}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('SIGN_UP')}
                  className={`flex-1 py-3 text-sm font-bold border-b-2 transition duration-150 cursor-pointer ${authTab === 'SIGN_UP'
                      ? 'border-[#0B3D91] dark:border-[#F58220] text-[#0B3D91] dark:text-[#F58220]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  {t('auth.signUp')}
                </button>
              </div>

              {/* Citizen Authentication Forms */}
              <div className="space-y-4">
                {/* ========================================================================= */}
                {/* 1. SIGN IN TAB (Email + Password -> Citizen Dashboard) */}
                {/* ========================================================================= */}
                {authTab === 'SIGN_IN' && (
                  <div className="space-y-4">
                    <form onSubmit={handleCitizenLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {t('auth.emailAddress')}
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            value={citizenEmail}
                            onChange={(e) => setCitizenEmail(e.target.value)}
                            placeholder={t('auth.emailPlaceholder')}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t('auth.password')}
                          </label>
                          <a
                            href="/forgot-password"
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            {t('auth.forgotPassword')}
                          </a>
                        </div>
                        <div className="relative">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input
                            type={showCitizenPassword ? 'text' : 'password'}
                            required
                            value={citizenPassword}
                            onChange={(e) => setCitizenPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCitizenPassword(!showCitizenPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showCitizenPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Citizen Preset */}
                      <div className="pt-2">
                        <div className="text-[10px] text-slate-500 font-bold mb-1.5 flex items-center justify-between">
                          <span>{t('auth.citizenQuickAccess')}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCitizenEmail('riya.patnaik@example.com');
                              setCitizenPassword('Citizen@2026');
                            }}
                            className="text-[11px] underline hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer font-bold"
                          >
                            {t('auth.fillCredentials')}
                          </button>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                          {t('auth.citizenSavedCredentialsDesc')}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>{t('auth.signInCitizenDashboard')}</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Switch to Sign Up */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">{t('auth.newResident')}</span>
                      <button
                        type="button"
                        onClick={() => setAuthTab('SIGN_UP')}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {t('auth.signUpWithPhoneOtp')}
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 2. SIGN UP TAB (Email/Phone + Password -> Citizen Dashboard) */}
                {/* ========================================================================= */}
                {authTab === 'SIGN_UP' && (
                  <div className="space-y-4 animate-fade-in">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setErrorMessage(null);
                      if (!fullName || !email || !signUpPassword) {
                        setErrorMessage(t('auth.errFillAllFields'));
                        return;
                      }
                      try {
                        await registerCitizen({
                          name: fullName.trim(),
                          email: email.trim(),
                          password: signUpPassword,
                          phone_number: phoneNumber ? `+91 ${phoneNumber}` : undefined,
                          notification_sms_enabled: smsOptIn
                        });
                        setSuccessMessage(t('auth.successSignedUp'));
                        setAuthTab('SIGN_IN');
                        setCitizenEmail(email);
                      } catch (err: any) {
                        setErrorMessage(err.message ? tx(err.message) : t('auth.errRegistrationFailed'));
                      }
                    }} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {t('auth.fullNameReq')}
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('auth.citizenNamePlaceholder')} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {t('auth.emailAddressReq')}
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {t('auth.passwordReq')}
                        </label>
                        <div className="relative">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                          <input type="password" required minLength={6} value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {t('auth.mobileOptional')}
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-bold text-slate-500 dark:text-slate-400 select-none">+91</span>
                          <span className="absolute left-10 text-slate-300 dark:text-slate-700 select-none">|</span>
                          <input type="tel" value={phoneNumber} onChange={handlePhoneChange} placeholder="98765 43210" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-13 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          {t('auth.optInDisasterSms')}
                        </span>
                        <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="w-4 h-4 accent-emerald-600 rounded cursor-pointer" />
                      </div>

                      <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t('auth.registerAccount')}</span>}
                      </button>
                    </form>
                  </div>
                )}

                {/* ========================================================================= */}
                {authTab === 'SIGN_UP' && (
                  <div className="space-y-4">
                    {!isOtpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            {t('auth.mobileNumber')}
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                              +91
                            </span>
                            <span className="absolute left-10 text-slate-300 dark:text-slate-700 select-none">|</span>
                            <input
                              type="tel"
                              required
                              value={phoneNumber}
                              onChange={handlePhoneChange}
                              placeholder="98765 43210"
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-13 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 transition"
                            />
                          </div>
                        </div>

                        {/* Phone Preset */}
                        <div className="pt-2">
                          <div className="text-[10px] text-slate-500 font-bold mb-1.5 flex items-center justify-between">
                            <span>{t('auth.citizenPhonePreset')}</span>
                            <button
                              type="button"
                              onClick={() => setPhoneNumber('9876543210')}
                              className="text-[11px] underline hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer font-bold"
                            >
                              {t('auth.usePhonePreset')}
                            </button>
                          </div>
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                            {t('auth.testPhoneDesc')}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                            {t('auth.optInDisasterSms')}
                          </span>
                          <input
                            type="checkbox"
                            checked={smsOptIn}
                            onChange={(e) => setSmsOptIn(e.target.checked)}
                            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || phoneNumber.length < 10}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Phone className="w-3.5 h-3.5" />
                              <span>{t('auth.sendOtp')}</span>
                            </>
                          )}
                        </button>

                        {/* Switch to Sign In */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400">{t('auth.alreadyRegistered')}</span>
                          <button
                            type="button"
                            onClick={() => setAuthTab('SIGN_IN')}
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            {t('auth.signInWithEmail')}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* 6-Digit OTP Verification Screen (Standard OTP 123456) */
                      <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t('auth.enterOtpSentToPhone')}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            +91 {phoneNumber}
                          </p>
                        </div>

                        {/* 6-digit box inputs */}
                        <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => { otpInputRefs.current[idx] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-10 h-12 text-center text-lg font-bold bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600 transition shadow-2xs"
                            />
                          ))}
                        </div>

                        {/* Helper Banner */}
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            <span>{t('auth.standardOtp')} <strong>123456</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={handleAutofillDemoOtp}
                            className="text-[11px] font-bold underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                          >
                            {t('auth.autoFill')}
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading || otpDigits.join('').length < 6}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{t('auth.verifyOtpAndEnter')}</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <button
                            type="button"
                            onClick={() => setIsOtpSent(false)}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
                          >
                            {t('auth.changePhoneNumber')}
                          </button>
                          <button
                            type="button"
                            disabled={resendTimer > 0 || isLoading}
                            onClick={() => handleSendOtp()}
                            className={`font-bold transition cursor-pointer ${resendTimer > 0
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-emerald-600 dark:text-emerald-400 hover:underline'
                              }`}
                          >
                            {resendTimer > 0 ? t('auth.resendOtpIn', { count: resendTimer }) : t('auth.resendOtp')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3B: GOVERNMENT OFFICIAL LOGIN FLOW */}
          {/* ========================================================================= */}
          {authStep === 'GOV_LOGIN' && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-xl p-6 sm:p-8 space-y-6 transition-all duration-200">
              {/* Back button + Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthStep('NON_ADMIN_SELECTION');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth.backToRoleSelection')}</span>
                </button>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {t('auth.govPortal')}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#F58220]" />
                  <span>{t('auth.govSignInTitle')}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t('auth.govSignInDesc')}
                </p>
              </div>

              {/* Error / Success Toast Feedback */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{tx(errorMessage)}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium">{tx(successMessage)}</span>
                </div>
              )}

              {/* Official Email / Password Sign In Form */}
              <form onSubmit={handleOfficialLogin} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('auth.officialGovEmailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={officialEmail}
                      onChange={(e) => setOfficialEmail(e.target.value)}
                      placeholder="officer@bmc.gov.in"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#F58220] transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('auth.officialPasswordKey')}
                    </label>
                    <a
                      href="/forgot-password"
                      className="text-[11px] font-bold text-[#F58220] hover:underline cursor-pointer"
                    >
                      {t('auth.forgotPassword')}
                    </a>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showOfficialPassword ? 'text' : 'password'}
                      required
                      value={officialPassword}
                      onChange={(e) => setOfficialPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#F58220] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOfficialPassword(!showOfficialPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showOfficialPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Presets for Reviewers */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center justify-between font-bold">
                    <span>{t('auth.authorizedOfficialPreset')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficialEmail('api_official@bmc.gov.in');
                        setOfficialPassword('OfficialPassword123!');
                      }}
                      className="text-[11px] underline hover:text-[#F58220] cursor-pointer font-bold"
                    >
                      {t('auth.fillCredentials')}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    {t('auth.officialSavedCredentialsDesc')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#F58220] hover:bg-[#DC721A] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('auth.signInCommandCenter')}</span>
                    </>
                  )}
                </button>

                {/* Request Authorization Modal Link */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{t('auth.needDeptAccess')}</span>
                  <button
                    type="button"
                    onClick={() => setIsAuthRequestOpen(true)}
                    className="font-bold text-[#0B3D91] dark:text-[#F58220] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{t('auth.requestAuthorization')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer Branding Bar */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {t('auth.footerCopyright')}
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="/privacy-policy" className="hover:text-slate-800 dark:hover:text-slate-200 underline">{t('auth.privacyPolicy')}</a>
            <a href="/terms" className="hover:text-slate-800 dark:hover:text-slate-200 underline">{t('auth.termsConditions')}</a>
            <a href="/cookie-preferences" className="hover:text-slate-800 dark:hover:text-slate-200 underline">{t('auth.cookiePreferences')}</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL: Request Official Authorization */}
      {/* ========================================================================= */}
      {isAuthRequestOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#8A9A86] rounded-xl text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#2F3E46] dark:text-white font-heading">
                    {t('auth.govAuthTitle')}
                  </h3>
                  <p className="text-xs text-[#66736F] dark:text-slate-400">
                    {t('auth.govAuthSubtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthRequestOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {authRequestSubmitted ? (
              <div className="py-8 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 bg-[#4D8B63]/20 text-[#4D8B63] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#2F3E46] dark:text-white font-heading">
                  {t('auth.reqSubmittedTitle')}
                </h4>
                <p className="text-xs text-[#66736F] dark:text-slate-400 max-w-sm mx-auto">
                  {t('auth.reqSubmittedDesc')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAuthRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">
                    {t('auth.officerFullNameReq')}
                  </label>
                  <input
                    type="text"
                    required
                    value={officialForm.name}
                    onChange={(e) => setOfficialForm({ ...officialForm, name: e.target.value })}
                    placeholder={t('auth.officialFullNamePlaceholder')}
                    className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">
                      {t('auth.officialGovEmailReq')}
                    </label>
                    <input
                      type="email"
                      required
                      value={officialForm.email}
                      onChange={(e) => setOfficialForm({ ...officialForm, email: e.target.value })}
                      placeholder="name@bmc.gov.in"
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">
                      {t('auth.contactPhoneReq')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={officialForm.phone}
                      onChange={(e) => setOfficialForm({ ...officialForm, phone: e.target.value })}
                      placeholder="+91 94370 12345"
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">
                      {t('auth.departmentReq')}
                    </label>
                    <input
                      type="text"
                      required
                      value={officialForm.department}
                      onChange={(e) => setOfficialForm({ ...officialForm, department: e.target.value })}
                      placeholder={t('auth.deptPlaceholder')}
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">
                      {t('auth.designationReq')}
                    </label>
                    <input
                      type="text"
                      required
                      value={officialForm.designation}
                      onChange={(e) => setOfficialForm({ ...officialForm, designation: e.target.value })}
                      placeholder={t('auth.designationPlaceholder')}
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">
                    {t('auth.empBadgeId')}
                  </label>
                  <input
                    type="text"
                    value={officialForm.idNumber}
                    onChange={(e) => setOfficialForm({ ...officialForm, idNumber: e.target.value })}
                    placeholder="BMC-DIS-2026-981"
                    className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                  />
                </div>

                <div className="p-3 bg-[#C68A27]/10 border border-[#C68A27]/30 rounded-xl text-[11px] text-[#C68A27] leading-relaxed">
                  {t('auth.reviewedWithin24h')}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAuthRequestOpen(false)}
                    className="flex-1 py-2.5 bg-[#F3EFEA] hover:bg-[#D9D6CF] dark:bg-slate-800 text-[#2F3E46] dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-[#8A9A86] hover:bg-[#778873] text-white rounded-xl font-bold transition shadow-2xs cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('auth.submitRequest')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Forgot Password Info */}
      {/* ========================================================================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800 max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-10 h-10 bg-[#C53030]/10 text-[#C53030] rounded-xl flex items-center justify-center mx-auto">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#2F3E46] dark:text-white font-heading">
                {t('auth.resetAdminKeyTitle')}
              </h4>
              <p className="text-xs text-[#66736F] dark:text-slate-400 leading-relaxed">
                {t('auth.resetAdminKeyDesc')}
              </p>
            </div>
            <div className="p-3 bg-[#F9F7F3] dark:bg-slate-950 rounded-xl border border-[#D9D6CF] dark:border-slate-800 text-[11px] text-[#66736F] dark:text-slate-400 text-center">
              {t('auth.itSupportLine')}
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-[#8A9A86] text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-[#778873] transition"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
