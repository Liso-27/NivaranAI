import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DisasterDataProvider, useDisasterData } from './context/DisasterDataContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/layout/Header';
import { NewsTicker } from './components/layout/NewsTicker';
import { TabNav } from './components/layout/TabNav';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { SafePlaceFinder } from './components/citizen/SafePlaceFinder';
import { CitizenReportsHistory } from './components/citizen/CitizenReportsHistory';
import { NewsFeedView } from './components/citizen/NewsFeedView';
import { NotificationSettingsModal } from './components/citizen/NotificationSettingsModal';
import { GovCommandCenter } from './components/government/GovCommandCenter';
import { ReportTriageView } from './components/government/ReportTriageView';
import { CampManagerView } from './components/government/CampManagerView';
import { DisasterMap } from './components/map/DisasterMap';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LoginPage } from './components/auth/LoginPage';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { TermsPage } from './components/legal/TermsPage';
import { CookiePreferencesModal } from './components/legal/CookiePreferencesModal';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { PasswordResetPage } from './components/auth/PasswordResetPage';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

const CITIZEN_TABS = ['CITIZEN_MAP', 'SAFE_PLACES', 'CITIZEN_REPORTS', 'DISASTER_NEWS'];
const GOV_TABS = ['GOV_COMMAND', 'GOV_TRIAGE', 'GOV_CAMPS', 'GOV_MAP'];
const ADMIN_TABS = ['ADMIN_OVERVIEW', 'ADMIN_SCHEDULER', 'ADMIN_HEALTH', 'ADMIN_USERS', 'ADMIN_LOGS'];

const MainAppContent: React.FC = () => {
  const { role, user } = useAuth();
  const { isLoading, error, refreshData } = useDisasterData();

  const getDefaultTab = (userRole: string) => {
    if (userRole === 'GOVERNMENT_OFFICIAL') return 'GOV_COMMAND';
    if (userRole === 'SYSTEM_ADMIN') return 'ADMIN_OVERVIEW';
    return 'CITIZEN_MAP';
  };

  const [currentTab, setCurrentTab] = useState<string>(() => getDefaultTab(role));
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);

  // Sync default tab based on authenticated role
  useEffect(() => {
    if (role === 'CITIZEN' && !CITIZEN_TABS.includes(currentTab)) {
      setCurrentTab('CITIZEN_MAP');
    } else if (role === 'GOVERNMENT_OFFICIAL' && !GOV_TABS.includes(currentTab)) {
      setCurrentTab('GOV_COMMAND');
    } else if (role === 'SYSTEM_ADMIN' && !ADMIN_TABS.includes(currentTab)) {
      setCurrentTab('ADMIN_OVERVIEW');
    }
  }, [role, currentTab]);

  // Listen for brand logo clicks to navigate home
  useEffect(() => {
    const handleHomeNav = () => setCurrentTab(getDefaultTab(role));
    window.addEventListener('navigateHome', handleHomeNav);
    return () => window.removeEventListener('navigateHome', handleHomeNav);
  }, [role]);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'NOTIFICATION_SETTINGS') {
      setIsNotifSettingsOpen(true);
      return;
    }

    // Role-isolated tab navigation guard
    if (role === 'CITIZEN' && CITIZEN_TABS.includes(tabId)) {
      setCurrentTab(tabId);
    } else if (role === 'GOVERNMENT_OFFICIAL' && GOV_TABS.includes(tabId)) {
      setCurrentTab(tabId);
    } else if (role === 'SYSTEM_ADMIN' && ADMIN_TABS.includes(tabId)) {
      setCurrentTab(tabId);
    }
  };

  const isMapTab = 
    (role === 'CITIZEN' && currentTab === 'CITIZEN_MAP') || 
    (role === 'GOVERNMENT_OFFICIAL' && currentTab === 'GOV_MAP');

  return (
    <div className="flex flex-col h-screen max-h-screen w-full overflow-hidden bg-[#F5F7FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-[#F58220] selection:text-white transition-colors duration-200">
      {/* Header with Theme Toggle (Fixed natural height) */}
      <Header />

      {/* Moving News Ticker */}
      <NewsTicker />

      {/* Role-based Navigation Bar */}
      <TabNav currentTab={currentTab} onTabChange={handleTabChange} />

      {/* Main View Area */}
      <main className={`flex-1 flex flex-col min-h-0 relative ${isMapTab ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-[#F9F7F3]/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center animate-fade-in">
            <div className="p-6 bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800 shadow-xl flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[#8A9A86] animate-spin" />
              <p className="text-xs font-semibold text-[#2F3E46] dark:text-slate-300 font-heading">
                Syncing BMC 67-Ward Risk Engine Telemetry...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="m-4 p-4 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 rounded-lg text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3 shadow-xs shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => refreshData()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Citizen Routes */}
        {role === 'CITIZEN' && (
          <>
            {currentTab === 'CITIZEN_MAP' && <CitizenDashboard />}
            {currentTab === 'SAFE_PLACES' && <SafePlaceFinder />}
            {currentTab === 'CITIZEN_REPORTS' && <CitizenReportsHistory />}
            {currentTab === 'DISASTER_NEWS' && <NewsFeedView />}
          </>
        )}

        {/* Government Official Routes */}
        {role === 'GOVERNMENT_OFFICIAL' && (
          <>
            {currentTab === 'GOV_COMMAND' && <GovCommandCenter />}
            {currentTab === 'GOV_TRIAGE' && <ReportTriageView />}
            {currentTab === 'GOV_CAMPS' && <CampManagerView />}
            {currentTab === 'GOV_MAP' && (
              <div className="flex-1 w-full h-full min-h-0 relative">
                <DisasterMap />
              </div>
            )}
          </>
        )}

        {/* System Admin Routes */}
        {role === 'SYSTEM_ADMIN' && <AdminDashboard currentTab={currentTab} />}
      </main>

      {/* Notification Preferences Modal */}
      <NotificationSettingsModal
        isOpen={isNotifSettingsOpen}
        onClose={() => setIsNotifSettingsOpen(false)}
      />
    </div>
  );
};

const RootNavigation: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname === '/privacy-policy') {
    return <PrivacyPolicyPage />;
  }
  if (pathname === '/terms') {
    return <TermsPage />;
  }
  if (pathname === '/cookie-preferences') {
    return <CookiePreferencesModal isStandalonePage={true} />;
  }
  if (pathname === '/forgot-password') {
    return <ForgotPasswordPage />;
  }
  if (pathname === '/reset-password' || pathname === '/password-reset') {
    return <PasswordResetPage />;
  }

  // If user is not authenticated, show the LoginPage
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Once authenticated, show the existing NivaranAI dashboard
  return (
    <DisasterDataProvider>
      <MainAppContent />
    </DisasterDataProvider>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <RootNavigation />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

