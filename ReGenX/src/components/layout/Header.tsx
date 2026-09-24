import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Shield, 
  Bell, 
  MapPin, 
  Flame, 
  AlertTriangle, 
  Radio,
  Sun, 
  Moon, 
  Loader2 
} from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';
import { AuthModal } from '../auth/AuthModal';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Header: React.FC = () => {
  const { user, role, isAuthenticated } = useAuth();
  const { hazardZones, userLocation, requestUserLocation } = useDisasterData();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const emergencyCount = hazardZones.filter(z => z.severity === 'EMERGENCY').length;
  const highCount = hazardZones.filter(z => z.severity === 'HIGH').length;

  return (
    <>
      <header className="bg-white dark:bg-[#0F172A] text-slate-800 dark:text-white border-b border-slate-200 dark:border-[#1E293B] sticky top-0 z-40 px-4 py-2.5 shadow-xs dark:shadow-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & System Status */}
          <div className="flex items-center gap-3">
            <img 
              src="/nivaran-logo.png" 
              alt={t('header.logoAlt') || "NivaranAI Logo"} 
              className="w-9 h-9 object-contain rounded-full bg-white p-0.5 shadow-xs shrink-0" 
            />

            <div 
              className="cursor-pointer group flex flex-col"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateHome'))}
              title={t('header.returnHome')}
            >
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1 m-0 group-hover:text-[#D97706] transition-colors">
                  Nivaran<span className="text-[#D97706]">AI</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] text-emerald-600 dark:text-emerald-400">
                  <Radio className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                  {t('header.liveTelemetry')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                {t('header.bmcWardEngine')}
              </p>
            </div>
          </div>

          {/* Center Operational Status Element */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 dark:bg-[#1E293B] rounded-lg border border-slate-200 dark:border-[#334155] text-xs">
            {emergencyCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold bg-red-100 dark:bg-[#DC2626]/20 px-2 py-0.5 rounded border border-red-200 dark:border-[#DC2626]/40">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-0.5"></span>
                <Flame className="w-3.5 h-3.5" />
                {t('header.emergencyRisk', { count: emergencyCount })}
              </span>
            )}
            {highCount > 0 && (
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold bg-orange-100 dark:bg-[#EA580C]/20 px-2 py-0.5 rounded border border-orange-200 dark:border-[#EA580C]/40">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t('header.highRiskBadge', { count: highCount })}
              </span>
            )}
            <span className="text-slate-600 dark:text-slate-300 text-[11px] font-medium">
              {t('header.activeIncidentsBadge', { count: hazardZones.length })}
            </span>
          </div>

          {/* Right Action Icons & Role Indicator */}
          <div className="flex items-center gap-2">
            {/* Language Switcher (Immediately to the LEFT of Theme Toggle) */}
            <LanguageSwitcher />

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#334155] rounded-lg transition duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              title={theme === 'light' ? t('header.switchToDark') : t('header.switchToLight')}
              aria-label={t('header.toggleTheme')}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* User GPS Location Quick Button */}
            <button
              onClick={() => requestUserLocation()}
              disabled={userLocation.isLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition duration-150 cursor-pointer ${
                userLocation.isLoading
                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-[#D97706]/20 dark:text-[#D97706] dark:border-[#D97706]/40'
                  : userLocation.isInsideHazardZone
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-[#DC2626]/20 dark:text-red-400 dark:border-[#DC2626]/50 font-semibold'
                  : userLocation.permissionGranted
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] dark:text-emerald-400 dark:border-[#059669]/50'
                  : userLocation.permissionStatus === 'denied'
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-[#DC2626]/20 dark:text-red-400 dark:border-[#DC2626]/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] dark:text-slate-200 dark:border-[#334155]'
              }`}
              title={
                userLocation.isLoading
                  ? t('header.gps.locatingTooltip')
                  : userLocation.isInsideHazardZone
                  ? t('header.gps.hazardZoneTooltip')
                  : userLocation.permissionGranted
                  ? t('header.gps.activeTooltip')
                  : userLocation.permissionStatus === 'denied'
                  ? t('header.gps.deniedTooltip')
                  : t('header.gps.detectTooltip')
              }
            >
              {userLocation.isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D97706]" />
              ) : (
                <MapPin className={`w-3.5 h-3.5 ${
                  userLocation.isInsideHazardZone
                    ? 'text-red-600 dark:text-red-400'
                    : userLocation.permissionGranted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : userLocation.permissionStatus === 'denied'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`} />
              )}
              <span className="hidden md:inline text-[11px] font-semibold truncate max-w-[120px]">
                {userLocation.isLoading 
                  ? t('header.gps.locating') 
                  : userLocation.isInsideHazardZone 
                  ? t('header.gps.hazardZone') 
                  : userLocation.permissionGranted 
                  ? t('header.gps.active') 
                  : userLocation.permissionStatus === 'denied' 
                  ? t('header.gps.denied') 
                  : t('header.gps.locateMe')}
              </span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#334155] rounded-lg relative transition duration-150 cursor-pointer"
              title={t('header.notificationsTitle')}
              aria-label={t('header.notificationsTitle')}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Authenticated Role Status Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold select-none bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1E293B] dark:text-slate-200 dark:border-[#334155]"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-400 dark:bg-slate-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {role === 'GOVERNMENT_OFFICIAL' ? t('header.role.govOfficial') : role === 'SYSTEM_ADMIN' ? t('header.role.sysAdmin') : t('header.role.citizen')}
              </span>
            </div>

            {/* User Account / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-1">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] rounded-lg border border-slate-200 dark:border-[#334155] text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title={`${user?.name || ''} (${t('header.accountDetails')})`}
                >
                  <div className="w-6 h-6 rounded bg-[#D97706] text-white flex items-center justify-center font-bold text-[11px]">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                {t('common.signIn')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <NotificationDrawer isOpen={isNotifDrawerOpen} onClose={() => setIsNotifDrawerOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
