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
      <header className="bg-[#0F172A] text-white border-b border-[#1E293B] sticky top-0 z-40 px-4 py-2.5 shadow-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & System Status */}
          <div className="flex items-center gap-3">
            <img 
              src="/nivaran-logo.png" 
              alt="NivaranAI Logo" 
              className="w-9 h-9 object-contain rounded-full bg-white p-0.5 shadow-xs shrink-0" 
            />

            <div 
              className="cursor-pointer group flex flex-col"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateHome'))}
              title="Return to Home"
            >
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1 m-0 group-hover:text-[#D97706] transition-colors">
                  Nivaran<span className="text-[#D97706]">AI</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-emerald-400">
                  <Radio className="w-2.5 h-2.5 text-emerald-400" />
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block group-hover:text-slate-200 transition-colors">
                Bhubaneswar Municipal Corporation • 67-Ward Risk Engine
              </p>
            </div>
          </div>

          {/* Center Operational Status Element */}
          <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-[#1E293B] rounded-lg border border-[#334155] text-xs">
            {emergencyCount > 0 && (
              <span className="flex items-center gap-1 text-red-400 font-semibold bg-[#DC2626]/20 px-2 py-0.5 rounded border border-[#DC2626]/40">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-0.5"></span>
                <Flame className="w-3.5 h-3.5" />
                {emergencyCount} EMERGENCY
              </span>
            )}
            {highCount > 0 && (
              <span className="flex items-center gap-1 text-orange-400 font-semibold bg-[#EA580C]/20 px-2 py-0.5 rounded border border-[#EA580C]/40">
                <AlertTriangle className="w-3.5 h-3.5" />
                {highCount} HIGH RISK
              </span>
            )}
            <span className="text-slate-300 text-[11px] font-medium">
              {hazardZones.length} ACTIVE INCIDENTS
            </span>
          </div>

          {/* Right Action Icons & Role Indicator */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 bg-[#1E293B] hover:bg-[#334155] text-slate-200 border border-[#334155] rounded-lg transition duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-200" />
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
                  ? 'bg-[#D97706]/20 text-[#D97706] border-[#D97706]/40'
                  : userLocation.isInsideHazardZone
                  ? 'bg-[#DC2626]/20 text-red-400 border-[#DC2626]/50 font-semibold'
                  : userLocation.permissionGranted
                  ? 'bg-[#1E293B] hover:bg-[#334155] text-emerald-400 border-[#059669]/50'
                  : userLocation.permissionStatus === 'denied'
                  ? 'bg-[#DC2626]/20 text-red-400 border-[#DC2626]/40'
                  : 'bg-[#1E293B] hover:bg-[#334155] text-slate-200 border-[#334155]'
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
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D97706]" />
              ) : (
                <MapPin className={`w-3.5 h-3.5 ${
                  userLocation.isInsideHazardZone
                    ? 'text-red-400'
                    : userLocation.permissionGranted
                    ? 'text-emerald-400'
                    : userLocation.permissionStatus === 'denied'
                    ? 'text-red-400'
                    : 'text-slate-400'
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
              className="p-2 bg-[#1E293B] hover:bg-[#334155] text-slate-200 border border-[#334155] rounded-lg relative transition duration-150 cursor-pointer"
              title="Disaster Notifications"
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold select-none bg-[#1E293B] text-slate-200 border-[#334155]"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {role === 'GOVERNMENT_OFFICIAL' ? 'Gov Official' : role === 'SYSTEM_ADMIN' ? 'Sys Admin' : 'Citizen'}
              </span>
            </div>

            {/* User Account / Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-1">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 p-1.5 bg-[#1E293B] hover:bg-[#334155] rounded-lg border border-[#334155] text-xs text-slate-200 transition cursor-pointer"
                  title={`${user?.name} (Click for Account Details / Sign Out)`}
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
