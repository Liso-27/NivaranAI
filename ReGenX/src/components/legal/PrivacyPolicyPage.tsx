import React from 'react';
import { ArrowLeft, Shield, Lock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const PrivacyPolicyPage: React.FC = () => {
  const { theme } = useTheme();

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
              aria-label="Return to NivaranAI Platform"
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
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Legal Documentation
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Document Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <FileText className="w-3.5 h-3.5 text-[#D97706]" />
            Privacy Policy & Data Practice Statement
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            NivaranAI Privacy Policy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Effective Date: September 2026 • Platform Version 3.4 • Bhubaneswar Municipal Corporation & Public Safety Network
          </p>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-lg text-rose-900 dark:text-rose-200 text-xs leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">CRITICAL EMERGENCY DISCLAIMER:</strong> NivaranAI is an emergency decision-support and public-safety telemetry application. The platform provides automated hazard intelligence to assist citizens and municipal officials. <strong className="font-bold">NivaranAI does NOT replace official emergency response services. In life-threatening emergencies, immediately dial National Emergency 112 or BMC Control Cell at 1929.</strong>
            </div>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">1</span>
              Information Collected
            </h2>
            <p>
              NivaranAI collects only the minimum operational information necessary to provide real-time hazard mapping, citizen report triage, emergency relief camp routing, and ward-level risk assessments:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-amber-500">
              <li><strong>Account & Authentication Information:</strong> Full name, email address, hashed credentials, and designated user role (Citizen, Government Official, System Admin). Mobile numbers are collected when explicitly provided for SMS hazard alerts or OTP verification.</li>
              <li><strong>Citizen Incident Reports:</strong> Information submitted voluntarily during emergency reporting, including hazard type, description, severity level, ward selection, photo attachments, and geographic coordinates of the reported incident.</li>
              <li><strong>Explicit Location Data:</strong> Precise GPS coordinates (latitude and longitude) are accessed strictly when you explicitly enable location features (e.g., clicking "Locate Me" or "Find Safe Places"). Location telemetry is cached locally on your device for session display.</li>
              <li><strong>Emergency & Safe-Place Interactions:</strong> Safe place queries, camp directions, and notification subscriptions chosen within the platform.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">2</span>
              How Information Is Used
            </h2>
            <p>
              Collected data is used strictly for public safety and disaster response operations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-amber-500">
              <li>Calculating 67-ward risk engine scores and evaluating real-time weather and flood hazard grids.</li>
              <li>Triage and verification of crowd-reported incidents by authorized BMC Government Officials.</li>
              <li>Dispatching critical emergency SMS and push alerts to registered residents in affected wards.</li>
              <li>Displaying nearest safe places, evacuation shelters, and optimal relief camp routing.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">3</span>
              Third-Party Integrated Services
            </h2>
            <p>
              NivaranAI integrates with standard public cloud infrastructure and notification providers to execute its core public safety functions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white font-bold mb-1">Appwrite Backend & Cloud Database</strong>
                Stores encrypted user profile records, ward risk documents, official mitigations, and audit logs.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white font-bold mb-1">Firebase Authentication & FCM</strong>
                Provides secure Google OAuth verification for citizens and Web Push Notification dispatch.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white font-bold mb-1">Twilio SMS Telemetry API</strong>
                Dispatches time-sensitive emergency SMS notifications to users opting in to SMS alerts.
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white font-bold mb-1">OpenStreetMap & Leaflet</strong>
                Renders open public map tiles for disaster grid visualization.
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              NivaranAI does NOT sell, rent, or trade your personal data to commercial advertisers or third-party marketing vendors.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">4</span>
              Data Security & Retention
            </h2>
            <p>
              We implement industry-standard encryption protocols (`HTTPS/TLS 1.3`), role-based access control (RBAC), and server-side authorization checks. Session tokens are stored in local browser storage (`localStorage`) and validated on every API request.
            </p>
            <p>
              Incident reports and operational risk logs are retained for historical disaster analysis and audit evaluation by municipal authorities. Account details are retained for active account duration.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">5</span>
              User Rights & Contact
            </h2>
            <p>
              Users have the right to request access to their profile data, update notification preferences, or request account removal. For privacy inquiries or data requests, please contact:
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
              <div><strong>Data Protection Contact:</strong> [Insert Official Organization Contact Email / Support Address]</div>
              <div><strong>Support Desk:</strong> privacy@nivaran.ai • +91 674 243 0001</div>
              <div><strong>Office Address:</strong> [Insert Municipal Corporation Head Office Address]</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 NivaranAI • Disaster Management & Public Safety System</span>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="/terms" className="hover:text-slate-800 dark:hover:text-slate-200 underline">Terms & Conditions</a>
            <a href="/cookie-preferences" className="hover:text-slate-800 dark:hover:text-slate-200 underline">Cookie Preferences</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
