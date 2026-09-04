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
    <nav className="bg-[#0F172A] text-slate-300 border-b border-[#1E293B] px-4 flex items-center overflow-x-auto select-none shrink-0">
      <div className="max-w-7xl mx-auto flex items-center gap-1 w-full text-xs py-1">
        {activeTabsList.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-3 border-b-2 transition-all duration-150 flex items-center gap-2 whitespace-nowrap rounded-t font-semibold cursor-pointer focus:outline-none ${
                isActive
                  ? role === 'GOVERNMENT_OFFICIAL'
                    ? 'border-[#EA580C] text-white bg-[#1E293B]'
                    : role === 'SYSTEM_ADMIN'
                    ? 'border-[#DC2626] text-white bg-[#1E293B]'
                    : 'border-[#D97706] text-white bg-[#1E293B]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D97706]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
