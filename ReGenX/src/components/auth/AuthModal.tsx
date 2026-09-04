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
  const [citizenName, setCitizenName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(true);

  // Official Form state
  const [officialName, setOfficialName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [officialPhone, setOfficialPhone] = useState('');
  const [department, setDepartment] = useState('BMC Disaster Response Cell');
  const [designation, setDesignation] = useState('Executive Engineer');

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
      <div className="bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800 max-w-md w-full p-6 space-y-6 shadow-2xl relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9D6CF] dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#8A9A86] rounded-xl text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#2F3E46] dark:text-white font-heading">
                {isAuthenticated ? 'User Account Details' : 'Account & Access Portal'}
              </h3>
              <p className="text-xs text-[#66736F] dark:text-slate-400">
                Authentication & Role Credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#F3EFEA] dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#F9F7F3] dark:bg-slate-950 rounded-xl border border-[#D9D6CF] dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#2F3E46] dark:text-white font-heading">{user?.name}</h4>
                  <p className="text-xs text-[#66736F] dark:text-slate-400">{user?.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#8A9A86]/20 text-[#2F3E46] dark:bg-emerald-500/20 dark:text-emerald-300 uppercase">
                  {user?.role.replace('_', ' ')}
                </span>
              </div>

              {user?.phone_number && (
                <div className="text-xs text-[#66736F] dark:text-slate-400 pt-1 border-t border-[#D9D6CF] dark:border-slate-800/80">
                  📱 Phone: <strong className="text-[#2F3E46] dark:text-slate-300">{user.phone_number}</strong>
                </div>
              )}

              {user?.department && (
                <div className="text-xs text-[#66736F] dark:text-slate-400">
                  🏛️ Dept: <strong className="text-[#2F3E46] dark:text-slate-300">{user.department}</strong> ({user.designation})
                </div>
              )}

              {user?.role === 'GOVERNMENT_OFFICIAL' && (
                <div className="text-xs">
                  Official Verification: <span className="font-bold text-[#C68A27]">{user.official_status}</span>
                </div>
              )}
            </div>

            {/* Twilio SMS Toggle (Section 15) */}
            <div className="p-4 bg-[#F9F7F3] dark:bg-slate-950 rounded-xl border border-[#D9D6CF] dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#2F3E46] dark:text-white block">Twilio SMS Alerts</span>
                <span className="text-[11px] text-[#66736F] dark:text-slate-400">
                  Receive HIGH/EMERGENCY severity SMS
                </span>
              </div>
              <input
                type="checkbox"
                checked={user?.notification_sms_enabled ?? false}
                onChange={(e) => updateSmsPreference(e.target.checked)}
                className="w-4 h-4 accent-[#B86B52] rounded cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-2.5 bg-[#C53030]/10 hover:bg-[#C53030]/20 text-[#C53030] dark:bg-rose-600/20 dark:hover:bg-rose-600/30 dark:text-rose-300 border border-[#C53030]/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Current Session</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F3EFEA] dark:bg-slate-950 rounded-xl border border-[#D9D6CF] dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('CITIZEN')}
                className={`py-2 rounded-lg transition ${
                  activeTab === 'CITIZEN' ? 'bg-[#8A9A86] text-white shadow-2xs' : 'text-[#66736F] dark:text-slate-400 hover:text-[#2F3E46] dark:hover:text-white'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('OFFICIAL')}
                className={`py-2 rounded-lg transition ${
                  activeTab === 'OFFICIAL' ? 'bg-[#8A9A86] text-white shadow-2xs' : 'text-[#66736F] dark:text-slate-400 hover:text-[#2F3E46] dark:hover:text-white'
                }`}
              >
                BMC Official
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN')}
                className={`py-2 rounded-lg transition ${
                  activeTab === 'ADMIN' ? 'bg-[#8A9A86] text-white shadow-2xs' : 'text-[#66736F] dark:text-slate-400 hover:text-[#2F3E46] dark:hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Citizen Form */}
            {activeTab === 'CITIZEN' && (
              <form onSubmit={handleCitizenSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                      placeholder="Full Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                      placeholder="citizen@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">
                    Phone Number (for Twilio Disaster SMS)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                      placeholder="+919876543210"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F9F7F3] dark:bg-slate-950/60 rounded-xl border border-[#D9D6CF] dark:border-slate-800">
                  <span className="text-[#2F3E46] dark:text-slate-300 font-medium">Opt-in to Emergency SMS</span>
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#B86B52] rounded cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#8A9A86] hover:bg-[#778873] text-white rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2"
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
                  <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Officer Name</label>
                  <input
                    type="text"
                    required
                    value={officialName}
                    onChange={(e) => setOfficialName(e.target.value)}
                    className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                  />
                </div>

                <div>
                  <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Official Gov Email</label>
                  <input
                    type="email"
                    required
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Department</label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-xl px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#C68A27]/10 border border-[#C68A27]/30 rounded-xl text-[11px] text-[#C68A27] dark:text-amber-300 leading-relaxed">
                  ⚠️ Official accounts require System Admin approval before command privileges are activated.
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#8A9A86] hover:bg-[#778873] text-white rounded-xl font-bold transition shadow-xs"
                >
                  Register Official Account
                </button>
              </form>
            )}

            {/* Admin Login */}
            {activeTab === 'ADMIN' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-[#F9F7F3] dark:bg-slate-950 rounded-xl border border-[#D9D6CF] dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-[#2F3E46] dark:text-white block">System Administrator Bypass</span>
                  <p className="text-[#66736F] dark:text-slate-400 leading-relaxed">
                    Direct authentication as Senior Operations Engineer with access to the 20-minute scheduler telemetry, external API health matrix, and official authorization controls.
                  </p>
                </div>

                <button
                  onClick={handleAdminSubmit}
                  className="w-full py-2.5 bg-[#C53030] hover:bg-[#A82828] text-white rounded-xl font-bold transition shadow-xs"
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
