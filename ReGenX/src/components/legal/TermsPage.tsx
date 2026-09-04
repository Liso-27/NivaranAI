import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, FileCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const TermsPage: React.FC = () => {
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
            <FileCheck className="w-3.5 h-3.5 text-[#D97706]" />
            Terms & Conditions
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Document Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-[#D97706]" />
            Platform Usage Terms & Conditions
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Effective Date: September 2026 • Platform Version 3.4 • Bhubaneswar Municipal Corporation Decision-Support System
          </p>

          {/* Mandatory Emergency Banner */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-lg text-rose-900 dark:text-rose-200 text-xs leading-relaxed flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">MANDATORY EMERGENCY SERVICE DISCLAIMER:</strong> NivaranAI provides decision-support public safety telemetry and risk modeling. <strong className="font-bold">NivaranAI is NOT a substitute for official emergency services. Users MUST follow instructions from official disaster authorities (OSDMA, BMC, Police, Fire Services). In an immediate life-threatening emergency, call National Emergency Services (112) or BMC Control (1929).</strong>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, registering for, or using the NivaranAI application, web portal, or associated APIs, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, you should not access or use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">2</span>
              Description of the Platform
            </h2>
            <p>
              NivaranAI is a disaster-management and public-safety decision-support prototype platform created to assist the Bhubaneswar Municipal Corporation (BMC) area. Features include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-amber-500">
              <li>Geospatial risk mapping across 67 BMC municipal wards.</li>
              <li>Real-time hazard scoring, weather alert aggregation, and risk grid visualization.</li>
              <li>Citizen incident reporting and official government report triage workflows.</li>
              <li>Relief camp routing, safe place locator, and evacuation shelter management.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">3</span>
              Appropriate Use & Citizen Reporting
            </h2>
            <p>
              Users are responsible for ensuring that all information submitted through NivaranAI is truthful and accurate to the best of their knowledge:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-amber-500">
              <li>Submitting deliberately false, fabricated, or misleading disaster reports is strictly prohibited.</li>
              <li>Attempting to disrupt telemetry feeds, bypass role-based security controls, or impersonate government officials is grounds for immediate account suspension and referral to authorities.</li>
              <li>Submitted citizen reports may be reviewed, verified, or published by authorized municipal personnel.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">4</span>
              Risk Scores & Advisory Information
            </h2>
            <p>
              Risk scores, hazard zone classifications, and evacuation advisories generated by NivaranAI are computed as decision-support estimations using available sensors, weather feeds, and crowd submissions. They do not constitute guaranteed guarantees of absolute safety or zero risk.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">5</span>
              Service Availability & Accuracy
            </h2>
            <p>
              While we strive for high uptime and rapid data synchronization, NivaranAI is provided on an "as is" and "as available" basis. Operational availability may be impacted by network connectivity, severe weather events, or third-party infrastructure maintenance.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">6</span>
              Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted under applicable law, NivaranAI, its developers, and associated municipal partners shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use of or inability to use the platform or reliance on any public safety decision-support information provided herein.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs">7</span>
              Modifications & Contact Information
            </h2>
            <p>
              We reserve the right to modify these Terms & Conditions at any time. Continued use of the platform constitutes acceptance of updated terms.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1">
              <div><strong>Legal Department Contact:</strong> [Insert Official Legal Contact Email]</div>
              <div><strong>System Administration:</strong> support@nivaran.ai • +91 674 243 0001</div>
              <div><strong>Jurisdiction:</strong> Bhubaneswar, Odisha, India</div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 NivaranAI • Public Safety Decision-Support System</span>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="/privacy-policy" className="hover:text-slate-800 dark:hover:text-slate-200 underline">Privacy Policy</a>
            <a href="/cookie-preferences" className="hover:text-slate-800 dark:hover:text-slate-200 underline">Cookie Preferences</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
