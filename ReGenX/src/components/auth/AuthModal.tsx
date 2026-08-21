import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  LogIn,
  LogOut,
  Info
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    isAuthenticated, 
    login, 
    loginWithGoogle, 
    registerCitizen, 
    registerOfficial, 
    logout, 
    updateSmsPreference 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'CITIZEN' | 'OFFICIAL' | 'ADMIN'>('CITIZEN');

  // Citizen Form state
  const [citizenName, setCitizenName] = useState('Priyabrata Nayak');
  const [citizenEmail, setCitizenEmail] = useState('priyabrata@example.com');
  const [citizenPhone, setCitizenPhone] = useState('+919876543210');
  const [smsEnabled, setSmsEnabled] = useState(true);

  // Official Form state
  const [officialName, setOfficialName] = useState('Dr. Sanjeev Mohapatra');
  const [officialEmail, setOfficialEmail] = useState('sanjeev.bmc@odisha.gov.in');
  const [officialPhone, setOfficialPhone] = useState('+919437012345');
  const [department, setDepartment] = useState('BMC Disaster Response Cell');
  const [designation, setDesignation] = useState('Assistant Commissioner');

  if (!isOpen) return null;

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerCitizen({
      name: citizenName,
      email: citizenEmail,
      phone_number: citizenPhone,
      notification_sms_enabled: smsEnabled
    });
    onClose();
  };

  const handleOfficialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerOfficial({
      name: officialName,
      email: officialEmail,
      phone_number: officialPhone,
      department,
      designation
    });
    onClose();
  };

  const handleAdminSubmit = async () => {
    await login('admin.ops@bmc.gov.in', 'Admin@2026', 'SYSTEM_ADMIN');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-6 shadow-2xl relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0B3D91] dark:bg-rose-600 rounded-xl text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
                {isAuthenticated ? 'User Account Details' : 'Account & Access Portal'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authentication & Role Credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">{user?.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user?.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0B3D91] dark:bg-sky-500/20 dark:text-sky-300 uppercase">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>

              {user?.phone_number && (
                <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  📱 Phone: <strong className="text-slate-800 dark:text-slate-300 font-mono">{user.phone_number}</strong>
                </div>
              )}

              {user?.department && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  🏛️ Dept: <strong className="text-slate-800 dark:text-slate-300">{user.department}</strong> ({user.designation})
                </div>
              )}

              {user?.role === 'GOVERNMENT_OFFICIAL' && (
                <div className="text-xs">
                  Official Verification: <span className="font-bold text-amber-600 dark:text-amber-400">{user.official_status}</span>
                </div>
              )}
            </div>

            {/* Twilio SMS Toggle (Section 15) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Twilio SMS Alerts</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Receive HIGH/EMERGENCY severity SMS
                </span>
              </div>
              <input
                type="checkbox"
                checked={user?.notification_sms_enabled ?? false}
                onChange={(e) => updateSmsPreference(e.target.checked)}
                className="w-4 h-4 accent-[#F58220] rounded cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Current Session</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('CITIZEN')}
                className={`py-2 rounded-lg transition ${
                  activeTab === 'CITIZEN' ? 'bg-[#0B3D91] dark:bg-slate-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('OFFICIAL')}
                className={`py-2 rounded-lg transition ${
                  activeTab === 'OFFICIAL' ? 'bg-[#0B3D91] dark:bg-slate-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                BMC Official
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN')}
                className={`py-2 rounded-lg transition ${
                  activeTab === 'ADMIN' ? 'bg-[#0B3D91] dark:bg-slate-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Citizen Form */}
            {activeTab === 'CITIZEN' && (
              <form onSubmit={handleCitizenSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91] dark:focus:border-[#F58220]"
                      placeholder="e.g. Priyabrata Nayak"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91] dark:focus:border-[#F58220]"
                      placeholder="citizen@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Phone Number (for Twilio Disaster SMS)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#0B3D91] dark:focus:border-[#F58220]"
                      placeholder="+919876543210"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Opt-in to Emergency SMS</span>
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#F58220] rounded cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Continue as Citizen</span>
                </button>
              </form>
            )}

            {/* Official Registration Form */}
            {activeTab === 'OFFICIAL' && (
              <form onSubmit={handleOfficialSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Officer Name</label>
                  <input
                    type="text"
                    required
                    value={officialName}
                    onChange={(e) => setOfficialName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Official Gov Email</label>
                  <input
                    type="email"
                    required
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  ⚠️ Official accounts require System Admin approval before command privileges are activated.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl font-bold transition shadow-md"
                >
                  Register Official Account
                </button>
              </form>
            )}

            {/* Admin Login */}
            {activeTab === 'ADMIN' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">System Administrator Bypass</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Direct authentication as Senior Operations Engineer with access to the 20-minute scheduler telemetry, external API health matrix, and official authorization controls.
                  </p>
                </div>

                <button
                  onClick={handleAdminSubmit}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-md"
                >
                  Authenticate as System Admin
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
