import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  Trash2, 
  CheckCheck, 
  Flame, 
  AlertTriangle, 
  Info, 
  ShieldAlert,
  Clock
} from 'lucide-react';
import { SEVERITY_BG_CLASSES } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    soundEnabled,
    toggleSound
  } = useNotifications();


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white font-heading">
                Disaster Alert Stream
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                In-app, FCM Push & Twilio SMS Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg border transition ${
                soundEnabled 
                  ? 'bg-[#8A9A86]/10 text-[#8A9A86] border-[#8A9A86]/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' 
                  : 'bg-[#F9F7F3] text-slate-400 border-[#D9D6CF] dark:bg-slate-800 dark:border-slate-700'
              }`}
              title={soundEnabled ? 'Alert audio sound enabled' : 'Alert audio sound muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{notifications.length} Alerts Total</span>
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
            <button
              onClick={clearAll}
              className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
              <ShieldAlert className="w-12 h-12 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Disaster Alerts</p>
              <p className="text-xs mt-1">
                You will be alerted immediately when risk thresholds escalate.
              </p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                  notif.read
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                    : 'bg-white dark:bg-slate-800/70 border-slate-300 dark:border-slate-700 shadow-sm'
                }`}
              >
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-[#F58220] absolute top-3.5 right-3.5" />
                )}


                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {notif.severity === 'EMERGENCY' ? (
                      <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    ) : notif.severity === 'HIGH' ? (
                      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${SEVERITY_BG_CLASSES[notif.severity]}`}>
                        {notif.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                      {notif.message}
                    </p>

                    {notif.ward_name && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 font-medium">
                        📍 {notif.ward_name} (Ward #{notif.ward_id})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
