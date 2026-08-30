import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { disasterApi } from '../../services/api';
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
  const [testFcmLoading, setTestFcmLoading] = useState(false);
  const [testFcmResult, setTestFcmResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleSendTestFcm = async () => {
    if (!fcmToken) return;
    setTestFcmLoading(true);
    setTestFcmResult(null);
    try {
      const res = await disasterApi.sendTestFcm(fcmToken);
      if (res?.success) {
        const mode = res?.mode === 'LIVE' ? 'LIVE FCM Push' : 'Simulated Mock Mode';
        setTestFcmResult(`✓ Test Notification Dispatched (${mode})`);
      } else {
        setTestFcmResult(`❌ Push Error: ${res?.error || 'Dispatch failed'}`);
      }
    } catch (err: any) {
      setTestFcmResult(`❌ Error: ${err?.message || 'Failed to dispatch test notification'}`);
    } finally {
      setTestFcmLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-6 shadow-2xl relative transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0B3D91] rounded-xl text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
                Disaster Alert & Notification Channels
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                FCM Push Tokens and Twilio SMS Preferences
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

        <div className="space-y-4 text-xs">
          {/* FCM Push Token Registration (Section 16) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#0B3D91] dark:text-cyan-400" />
                <strong className="text-slate-900 dark:text-white">Firebase Cloud Messaging (FCM)</strong>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                  : permissionStatus === 'denied'
                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
              }`}>
                {permissionStatus}
              </span>
            </div>

            {fcmError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg text-rose-700 dark:text-rose-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1 space-y-1">
                  <p>{fcmError}</p>
                  {permissionStatus !== 'denied' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="text-rose-800 dark:text-rose-200 font-bold underline hover:no-underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry Token Generation
                    </button>
                  )}
                </div>
              </div>
            )}

            {fcmToken ? (
              <div className="space-y-1.5">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all max-h-24 overflow-y-auto selection:bg-[#F58220] selection:text-white">
                  {fcmToken}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCopyToken}
                    className="text-[11px] text-[#0B3D91] dark:text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    {copiedToken ? '✓ Copied Token to Clipboard' : 'Copy FCM Device Token'}
                  </button>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ● Real FCM Token Active
                  </span>
                </div>
                {/* TEMPORARY TEST BUTTON (Remove after verification) */}
                <button
                  onClick={handleSendTestFcm}
                  disabled={testFcmLoading}
                  className="w-full mt-2 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testFcmLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test FCM Push...</span>
                    </>
                  ) : (
                    <span>Send Test FCM Push</span>
                  )}
                </button>
                {testFcmResult && (
                  <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1 text-center">
                    {testFcmResult}
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={requestNotificationPermission}
                disabled={fcmLoading || permissionStatus === 'denied'}
                className={`w-full py-2 px-4 rounded-xl font-bold transition shadow-xs flex items-center justify-center gap-2 ${
                  permissionStatus === 'denied'
                    ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-[#0B3D91] hover:bg-[#0A2F70] text-white cursor-pointer'
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
                  ? 'bg-blue-50 text-[#0B3D91] border-blue-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30'
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
