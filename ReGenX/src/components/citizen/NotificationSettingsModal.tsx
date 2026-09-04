import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  Bell, 
  Phone, 
  Volume2, 
  Smartphone,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { 
    fcmToken, 
    fcmLoading,
    fcmError,
    requestNotificationPermission, 
    soundEnabled, 
    toggleSound, 
    permissionStatus 
  } = useNotifications();
  const { user, updateSmsPreference } = useAuth();

  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800 max-w-lg w-full p-6 space-y-6 shadow-2xl relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9D6CF] dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#8A9A86] rounded-xl text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#2F3E46] dark:text-white font-heading">
                Disaster Alert & Notification Channels
              </h3>
              <p className="text-xs text-[#66736F] dark:text-slate-400">
                FCM Push Tokens and Twilio SMS Preferences
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

        <div className="space-y-4 text-xs">
          {/* FCM Push Token Registration (Section 16) */}
          <div className="p-4 bg-[#F9F7F3] dark:bg-slate-950 rounded-xl border border-[#D9D6CF] dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#8A9A86]" />
                <strong className="text-[#2F3E46] dark:text-white">Firebase Cloud Messaging (FCM)</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                permissionStatus === 'granted'
                  ? 'bg-[#4D8B63]/10 text-[#4D8B63] border-[#4D8B63]/30'
                  : permissionStatus === 'denied'
                  ? 'bg-[#C53030]/10 text-[#C53030] border-[#C53030]/30'
                  : 'bg-[#C68A27]/10 text-[#C68A27] border-[#C68A27]/30'
              }`}>
                {permissionStatus}
              </span>
            </div>

            {fcmError && (
              <div className="p-2.5 bg-[#C53030]/10 border border-[#C53030]/30 rounded-lg text-[#C53030] text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C53030]" />
                <div className="flex-1 space-y-1">
                  <p>{fcmError}</p>
                  {permissionStatus !== 'denied' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="text-[#C53030] font-bold underline hover:no-underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry Token Generation
                    </button>
                  )}
                </div>
              </div>
            )}

            {fcmToken ? (
              <div className="space-y-1.5">
                <div className="p-2 bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800 font-mono text-[10px] text-[#66736F] dark:text-slate-400 break-all max-h-24 overflow-y-auto selection:bg-[#B86B52] selection:text-white">
                  {fcmToken}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCopyToken}
                    className="text-[11px] text-[#8A9A86] font-bold hover:underline cursor-pointer"
                  >
                    {copiedToken ? '✓ Copied Token to Clipboard' : 'Copy FCM Device Token'}
                  </button>
                  <span className="text-[10px] text-[#4D8B63] font-semibold">
                    ● Real FCM Token Active
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={requestNotificationPermission}
                disabled={fcmLoading || permissionStatus === 'denied'}
                className={`w-full py-2 px-4 rounded-xl font-bold transition shadow-2xs flex items-center justify-center gap-2 ${
                  permissionStatus === 'denied'
                    ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-[#8A9A86] hover:bg-[#778873] text-white cursor-pointer'
                }`}
              >
                {fcmLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Secure FCM Token...</span>
                  </>
                ) : permissionStatus === 'denied' ? (
                  <span>Notifications Blocked in Browser</span>
                ) : (
                  <span>Enable Browser FCM Push Notifications</span>
                )}
              </button>
            )}
          </div>



          {/* Twilio SMS Preference (Section 15) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <strong className="text-slate-900 dark:text-white">Twilio SMS Disaster Dispatch</strong>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct SMS for HIGH and EMERGENCY hazard warnings
              </p>
            </div>

            <input
              type="checkbox"
              checked={user?.notification_sms_enabled ?? false}
              onChange={(e) => updateSmsPreference(e.target.checked)}
              className="w-4 h-4 accent-[#F58220] rounded cursor-pointer"
            />
          </div>

          {/* Audio Alerts */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <strong className="text-slate-900 dark:text-white">Alert Audio Chime</strong>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Play acoustic chime on new emergency bulletin
              </p>
            </div>

            <button
              onClick={toggleSound}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                soundEnabled
                  ? 'bg-amber-50 text-[#D97706] border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60'
                  : 'bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
