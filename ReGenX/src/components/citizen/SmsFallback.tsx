import React from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, PhoneCall, WifiOff, X, MapPin } from 'lucide-react';

/**
 * Placeholder emergency control room number.
 * MUST be confirmed as real before the team demos this.
 */
export const CONTROL_ROOM_NUMBER = '+91-674-2384300';

export interface SmsFallbackProps {
  open?: boolean;
  onClose?: () => void;
  selectedProblems?: string[];
}

export const SmsFallback: React.FC<SmsFallbackProps> = ({ open = true, onClose, selectedProblems }) => {
  const { userLocation } = useDisasterData();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!open) return null;

  const latStr = userLocation?.latitude != null ? Number(userLocation.latitude).toFixed(4) : '20.2961';
  const lngStr = userLocation?.longitude != null ? Number(userLocation.longitude).toFixed(4) : '85.8245';
  const wardName =
    userLocation?.ward_name ||
    (userLocation?.ward_id ? `Ward #${userLocation.ward_id}` : 'Bhubaneswar BMC');

  const handleSendSms = () => {
    const problemsHeader =
      selectedProblems && selectedProblems.length > 0
        ? `SOS EMERGENCY: ${selectedProblems.join(', ')}`
        : 'SOS EMERGENCY';
    const nameLine = user?.name ? `Name: ${user.name}\n` : '';
    const message = `${problemsHeader}\n${nameLine}Ward: ${wardName}\nLat: ${latStr}, Lng: ${lngStr}`;
    const smsUrl = `sms:${CONTROL_ROOM_NUMBER}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sms-fallback-title"
        className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700/60 max-w-md w-full p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-white space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="sms-fallback-title"
                className="text-base font-black font-heading text-amber-800 dark:text-amber-400"
              >
                {t('smsFallback.headerTitle')}
              </h3>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              aria-label={t('smsFallback.close')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Explanation */}
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
          {t('smsFallback.explanation')}
        </p>

        {/* Location & Details Preview */}
        <div className="p-3 bg-amber-50/70 dark:bg-slate-950/60 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{wardName}</span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
            Lat: {latStr}, Lng: {lngStr}
          </div>
          {selectedProblems && selectedProblems.length > 0 && (
            <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
              {selectedProblems.join(', ')}
            </div>
          )}
          {user?.name && (
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              {user.name}
            </div>
          )}
        </div>

        {/* Primary CTA: Send SOS via SMS */}
        <div>
          <button
            type="button"
            onClick={handleSendSms}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('smsFallback.sendBtn')}</span>
          </button>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center leading-relaxed">
            {t('smsFallback.helperText')}
          </p>
        </div>

        {/* Secondary Option: Plain-text Call Control Room */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <a
            href={`tel:${CONTROL_ROOM_NUMBER}`}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition underline underline-offset-4 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              {t('smsFallback.callControlRoom')}: {CONTROL_ROOM_NUMBER}
            </span>
          </a>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
            >
              {t('smsFallback.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsFallback;
