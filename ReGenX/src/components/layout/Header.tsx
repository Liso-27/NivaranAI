import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
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

export const Header: React.FC = () => {
  const { user, role, isAuthenticated } = useAuth();
  const { hazardZones, userLocation, requestUserLocation } = useDisasterData();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();

  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const emergencyCount = hazardZones.filter(z => z.severity === 'EMERGENCY').length;
  const highCount = hazardZones.filter(z => z.severity === 'HIGH').length;

  return (
    <>
      <header className="bg-white dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-40 backdrop-blur-xl px-4 py-2.5 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & System Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div className="p-2.5 bg-gradient-to-tr from-[#0B3D91] to-[#174fa3] dark:from-rose-600 dark:to-amber-500 rounded-xl text-white shadow-md shadow-[#0B3D91]/25 dark:shadow-rose-600/30 ring-1 ring-white/30 dark:ring-white/10 transition-transform duration-200 hover:scale-105">
                <Shield className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-950"></span>
              </span>
            </div>

            <div 
              className="cursor-pointer group flex flex-col"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateHome'))}
              title="Return to Home"
            >
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white font-heading tracking-tight flex items-center gap-1 m-0 group-hover:text-[#0B3D91] dark:group-hover:text-[#F58220] transition-colors">
                  Nivaran<span className="text-[#F58220]">AI</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
                  <Radio className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  BMC Risk Engine
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                Bhubaneswar Municipal Corporation • 67 Wards Analytical Network
              </p>
            </div>
          </div>

          {/* Center Hazard Stats Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
            {emergencyCount > 0 && (
              <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-500/30">
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <Flame className="w-3.5 h-3.5" />
                {emergencyCount} Emergency Zone{emergencyCount > 1 ? 's' : ''}
              </span>
            )}
            {highCount > 0 && (
              <span className="flex items-center gap-1 text-orange-700 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                {highCount} High Risk
              </span>
            )}
            <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
              {hazardZones.length} Active Incidents
            </span>
          </div>

          {/* Right Action Icons & Role Indicator */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition duration-150 shadow-2xs hover:scale-105 active:scale-95"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              aria-label="Toggle Theme"
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition duration-150 shadow-2xs hover:scale-102 active:scale-98 cursor-pointer ${
                userLocation.isLoading
                  ? 'bg-blue-50 text-[#0B3D91] border-blue-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30'
                  : userLocation.isInsideHazardZone
                  ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 animate-pulse'
                  : userLocation.permissionGranted
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-blue-300/80 dark:border-cyan-500/40'
                  : userLocation.permissionStatus === 'denied'
                  ? 'bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
              title={
                userLocation.isLoading
                  ? 'Acquiring GPS location...'
                  : userLocation.isInsideHazardZone
                  ? 'Warning: Inside active hazard zone!'
                  : userLocation.permissionGranted
                  ? 'GPS Active - Click to refresh coordinates'
                  : userLocation.permissionStatus === 'denied'
                  ? 'Location permission denied - Click to retry'
                  : 'Click to detect current GPS location'
              }
            >
              {userLocation.isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B3D91] dark:text-sky-400" />
              ) : (
                <MapPin className={`w-3.5 h-3.5 ${
                  userLocation.isInsideHazardZone
                    ? 'text-rose-600 dark:text-rose-400'
                    : userLocation.permissionGranted
                    ? 'text-blue-600 dark:text-cyan-400'
                    : userLocation.permissionStatus === 'denied'
                    ? 'text-rose-500'
                    : 'text-slate-500'
                }`} />
              )}
              <span className="hidden md:inline text-[11px] font-semibold truncate max-w-[120px]">
                {userLocation.isLoading 
                  ? 'Locating...' 
                  : userLocation.isInsideHazardZone 
                  ? 'Hazard Zone!' 
                  : userLocation.permissionGranted 
                  ? 'GPS Active' 
                  : userLocation.permissionStatus === 'denied'
                  ? 'GPS Blocked'
                  : 'Locate Me'}
              </span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl relative transition duration-150 shadow-2xs hover:scale-105 active:scale-95"
              title="Disaster Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Authenticated Role Status Badge (Static / Non-interactive) */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold shadow-2xs select-none ${
                role === 'GOVERNMENT_OFFICIAL'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40'
                  : role === 'SYSTEM_ADMIN'
                  ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-80" />
              <span className="text-[11px] uppercase tracking-wider font-black">
                {role === 'GOVERNMENT_OFFICIAL' ? 'Gov Official' : role === 'SYSTEM_ADMIN' ? 'Sys Admin' : 'Citizen'}
              </span>
            </div>

            {/* User Account / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-1">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title={`${user?.name} (Click for Account Details / Sign Out)`}
                >
                  <div className="w-6 h-6 rounded-lg bg-[#0B3D91] text-white flex items-center justify-center font-bold text-[11px]">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl font-bold text-xs transition shadow-md"
              >
                Sign In
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

