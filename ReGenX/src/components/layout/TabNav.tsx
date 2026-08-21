import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Map, 
  Building2, 
  Radio, 
  Newspaper, 
  Bell, 
  ShieldAlert, 
  ClipboardCheck, 
  Tent, 
  Layers, 
  Activity, 
  Clock, 
  Cpu, 
  Users, 
  FileText 
} from 'lucide-react';

interface TabNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ currentTab, onTabChange }) => {
  const { role } = useAuth();

  const citizenTabs = [
    { id: 'CITIZEN_MAP', label: 'Interactive Hazard Map', icon: Map },
    { id: 'SAFE_PLACES', label: 'Safe Places Near Me', icon: Building2 },
    { id: 'CITIZEN_REPORTS', label: 'My Observation History', icon: Radio },
    { id: 'DISASTER_NEWS', label: 'Disaster News & Bulletins', icon: Newspaper },
    { id: 'NOTIFICATION_SETTINGS', label: 'Alert Channels (FCM/SMS)', icon: Bell }
  ];

  const govTabs = [
    { id: 'GOV_COMMAND', label: 'Command Center', icon: ShieldAlert },
    { id: 'GOV_TRIAGE', label: 'Citizen Report Triage', icon: ClipboardCheck },
    { id: 'GOV_CAMPS', label: 'Relief Camp Management', icon: Tent },
    { id: 'GOV_MAP', label: 'Tactical Ward Map', icon: Layers }
  ];

  const adminTabs = [
    { id: 'ADMIN_OVERVIEW', label: 'Operations Overview', icon: Activity },
    { id: 'ADMIN_SCHEDULER', label: '20-Min Scheduler Telemetry', icon: Clock },
    { id: 'ADMIN_HEALTH', label: 'API & Service Matrix', icon: Cpu },
    { id: 'ADMIN_USERS', label: 'Official Approvals', icon: Users },
    { id: 'ADMIN_LOGS', label: 'Security Audit Logs', icon: FileText }
  ];

  const activeTabsList = 
    role === 'GOVERNMENT_OFFICIAL' ? govTabs :
    role === 'SYSTEM_ADMIN' ? adminTabs :
    citizenTabs;

  return (
    <nav className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center overflow-x-auto select-none transition-colors duration-200 shrink-0 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 w-full text-xs font-bold py-1">
        {activeTabsList.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-3.5 border-b-2 transition-all duration-200 flex items-center gap-2 whitespace-nowrap rounded-t-xl group cursor-pointer ${
                isActive
                  ? role === 'GOVERNMENT_OFFICIAL'
                    ? 'border-[#F58220] text-[#0B3D91] dark:text-amber-300 dark:border-amber-500 font-black bg-slate-100/80 dark:bg-slate-900/70 shadow-2xs'
                    : role === 'SYSTEM_ADMIN'
                    ? 'border-rose-600 text-rose-800 dark:text-rose-300 dark:border-rose-500 font-black bg-slate-100/80 dark:bg-slate-900/70 shadow-2xs'
                    : 'border-[#0B3D91] text-[#0B3D91] dark:border-[#F58220] dark:text-white font-black bg-slate-100/80 dark:bg-slate-900/70 shadow-2xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110 text-[#0B3D91] dark:text-[#F58220]' : 'text-slate-400 group-hover:scale-105 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

};
