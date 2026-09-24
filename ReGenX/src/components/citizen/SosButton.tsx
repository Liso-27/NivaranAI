import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { BMC_WARDS } from '../../data/bmcWards';
import {
  Siren,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  MessageSquare
} from 'lucide-react';
import SmsFallback from './SmsFallback';

interface ProblemOption {
  englishLabel: string;
  translationKey:
    | 'sos.problemTrapped'
    | 'sos.problemMedical'
    | 'sos.problemFire'
    | 'sos.problemFlooding'
    | 'sos.problemBuildingDamage'
    | 'sos.problemRoadBlocked'
    | 'sos.problemPowerOutage'
    | 'sos.problemOther';
}

const PROBLEM_OPTIONS: ProblemOption[] = [
  { englishLabel: 'Trapped / Stuck', translationKey: 'sos.problemTrapped' },
  { englishLabel: 'Medical Emergency / Injured', translationKey: 'sos.problemMedical' },
  { englishLabel: 'Fire', translationKey: 'sos.problemFire' },
  { englishLabel: 'Flooding / Water Rising', translationKey: 'sos.problemFlooding' },
  { englishLabel: 'Building Damage', translationKey: 'sos.problemBuildingDamage' },
  { englishLabel: 'Road Blocked', translationKey: 'sos.problemRoadBlocked' },
  { englishLabel: 'Power Outage', translationKey: 'sos.problemPowerOutage' },
  { englishLabel: 'Other', translationKey: 'sos.problemOther' },
];

export interface SosButtonProps {
  onSmsFallback?: (selectedProblems?: string[]) => void;
  className?: string;
}

export const SosButton: React.FC<SosButtonProps> = ({ onSmsFallback, className = '' }) => {
  const { userLocation, submitCrowdReport } = useDisasterData();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSmsFallbackNotice, setShowSmsFallbackNotice] = useState(false);
  const [isSmsFallbackOpen, setIsSmsFallbackOpen] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

  const toggleProblem = (englishLabel: string) => {
    setSelectedProblems((prev) =>
      prev.includes(englishLabel)
        ? prev.filter((p) => p !== englishLabel)
        : [...prev, englishLabel]
    );
  };

  /**
   * Helper to acquire fresh GPS fix using browser HTML5 Geolocation API with timeout.
   */
  const getFreshGpsLocation = (timeoutMs = 6000): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, timeoutMs);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          }
        },
        (_err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(null);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 10000
        }
      );
    });
  };

  /**
   * Fallback handler if submitCrowdReport throws, is undefined, or times out.
   */
  const triggerSmsFallback = (problemsToSend?: string[]) => {
    setIsSubmitting(false);
    setIsConfirmOpen(false);

    const problems = problemsToSend ?? selectedProblems;
    if (typeof onSmsFallback === 'function') {
      onSmsFallback(problems);
    }
    setIsSmsFallbackOpen(true);
  };

  /**
   * Main SOS transmission flow on confirmation.
   */
  const handleConfirm = async () => {
    if (isSubmitting || selectedProblems.length === 0) return;
    setIsSubmitting(true);
    setShowSmsFallbackNotice(false);

    try {
      // 1. Try fresh GPS fix with ~6s timeout, fallback to context userLocation
      const gps = await getFreshGpsLocation(6000);
      const latitude = gps?.lat ?? userLocation?.latitude ?? 20.2961;
      const longitude = gps?.lng ?? userLocation?.longitude ?? 85.8245;

      const wardId = userLocation?.ward_id || 57;
      const wardName =
        userLocation?.ward_name ||
        (BMC_WARDS.find((w) => w.ward_id === wardId)?.ward_name ?? `Ward #${wardId}`);

      if (typeof submitCrowdReport !== 'function') {
        triggerSmsFallback(selectedProblems);
        return;
      }

      // Map selected chips to structured fields
      const hasFlooding = selectedProblems.includes('Flooding / Water Rising');
      const hasRoadBlocked = selectedProblems.includes('Road Blocked');
      const hasPowerOutage = selectedProblems.includes('Power Outage');
      const hasBuildingDamage = selectedProblems.includes('Building Damage');

      const waterloggingPresent = hasFlooding ? 'YES' : 'UNKNOWN';
      const roadPassable = hasRoadBlocked ? 'NO' : 'UNKNOWN';
      const powerOutage = hasPowerOutage ? 'YES' : 'UNKNOWN';
      const structuralDamage = hasBuildingDamage ? 'YES' : 'UNKNOWN';

      // 2. Prepare structured SOS report payload
      const reportPayload: any = {
        observation_type: 'other',
        update_type: 'other',
        description: `🆘 SOS EMERGENCY: ${selectedProblems.join(', ')}`,
        responses: {
          waterlogging_present: waterloggingPresent,
          road_passable: roadPassable,
          power_outage: powerOutage,
          structural_damage: structuralDamage
        },
        waterlogging_present: waterloggingPresent,
        road_passable: roadPassable,
        is_road_passable: roadPassable,
        power_outage: powerOutage,
        power_operational: hasPowerOutage ? 'NO' : 'UNKNOWN',
        structural_damage: structuralDamage,
        ward_id: wardId,
        ward_name: wardName,
        latitude,
        longitude,
        citizen_id: user?.id,
        citizen_name: user?.name,
        reported_by_name: user?.name || 'Citizen Reporter',
        reported_by_role: user?.role || 'CITIZEN'
      };

      // 3. Race against 7s timeout
      const submitPromise = submitCrowdReport(reportPayload);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT_SOS_NETWORK')), 7000);
      });

      await Promise.race([submitPromise, timeoutPromise]);

      // 4. Success handling
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
    } catch (_err) {
      // Network failure, timeout, or submission error -> fallback to SMS
      triggerSmsFallback(selectedProblems);
    }
  };

  return (
    <>
      {/* Floating Emergency SOS Button Container */}
      <div className={`fixed bottom-20 right-6 z-40 flex flex-col items-end gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => {
            setShowSmsFallbackNotice(false);
            setIsConfirmOpen(true);
          }}
          aria-label={t('sos.buttonLabel')}
          title={t('sos.buttonLabel')}
          className="group relative flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:from-red-800 active:to-rose-800 text-white shadow-lg shadow-red-600/25 border border-red-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer select-none font-bold text-xs"
        >
          {/* Subtle live indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>

          <Siren className="w-4 h-4 text-white shrink-0" />
          <span className="tracking-wider uppercase font-extrabold">
            {t('sos.buttonLabel') || 'Emergency SOS'}
          </span>
        </button>
      </div>

      {/* Quick-Select Emergency SOS Panel */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sos-modal-title"
            className="bg-white dark:bg-slate-900 rounded-xl border border-red-300 dark:border-red-900/60 max-w-md w-full p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-white space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-full shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="sos-modal-title"
                    className="text-base font-black font-heading text-red-600 dark:text-red-400"
                  >
                    {t('sos.quickSelectTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('sos.quickSelectSubtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick-Select Chips (Multi-Select, Large Touch Targets) */}
            <div className="grid grid-cols-2 gap-2 my-2">
              {PROBLEM_OPTIONS.map((opt) => {
                const isSelected = selectedProblems.includes(opt.englishLabel);
                return (
                  <button
                    key={opt.englishLabel}
                    type="button"
                    onClick={() => toggleProblem(opt.englishLabel)}
                    className={`py-3 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between border cursor-pointer select-none text-left min-h-[50px] ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400/40'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="leading-snug">{t(opt.translationKey)}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                {t('sos.cancelBtn')}
              </button>
              <button
                type="button"
                disabled={isSubmitting || selectedProblems.length === 0}
                onClick={handleConfirm}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('sos.sending')}</span>
                  </>
                ) : (
                  <>
                    <Siren className="w-3.5 h-3.5" />
                    <span>{t('sos.sendSosBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-36 right-6 z-50 max-w-sm bg-emerald-600 text-white rounded-xl p-4 shadow-2xl flex items-center gap-3 border border-emerald-400 animate-fade-in"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black tracking-wide uppercase text-emerald-100">
              {t('sos.confirmTitle')}
            </p>
            <p className="text-xs font-semibold mt-0.5 text-white">
              {t('sos.successMessage')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SMS Fallback Notice */}
      {showSmsFallbackNotice && (
        <div
          role="alert"
          className="fixed bottom-36 right-6 z-50 max-w-sm bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-xl p-4 shadow-2xl text-slate-900 dark:text-white space-y-3 animate-fade-in"
        >
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-950/70 text-amber-600 rounded-full shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-amber-800 dark:text-amber-400">
                {t('sos.confirmTitle')}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                {t('sos.smsFallbackNotice')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSmsFallbackNotice(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowSmsFallbackNotice(false);
                if (typeof onSmsFallback === 'function') {
                  onSmsFallback(selectedProblems);
                }
                setIsSmsFallbackOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t('sos.smsFallbackBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Offline SMS Fallback Modal */}
      <SmsFallback
        open={isSmsFallbackOpen}
        onClose={() => setIsSmsFallbackOpen(false)}
        selectedProblems={selectedProblems}
      />
    </>
  );
};

export default SosButton;
