import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useLanguage } from '../../context/LanguageContext';
import { isStale } from '../../services/offlineCache';

/**
 * OfflineBanner component
 * 
 * Displays a slim, non-blocking warning banner fixed below the top header
 * when the app is offline or displaying stale cached disaster data.
 */
const OfflineBanner: React.FC = () => {
  const { isOffline, lastSyncedAt } = useDisasterData();
  const { t, formatTime } = useLanguage();

  // If online and data is fresh or not available, render nothing
  if (!isOffline && (lastSyncedAt === null || !isStale(lastSyncedAt))) {
    return null;
  }

  const timeString = lastSyncedAt !== null ? formatTime(lastSyncedAt) : '';

  const message = isOffline
    ? lastSyncedAt !== null
      ? t('offlineBanner.offlineWithTime', { time: timeString })
      : t('offlineBanner.offlineNoData')
    : t('offlineBanner.dataStale', { time: timeString });

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-14 left-0 right-0 z-30 bg-amber-500/95 dark:bg-amber-600/95 text-slate-950 dark:text-white px-4 py-1.5 shadow-xs border-b border-amber-600/40 flex items-center justify-center gap-2 text-xs font-semibold backdrop-blur-xs transition-colors duration-200"
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-950 dark:text-white" />
      <span>{message}</span>
    </aside>
  );
};

export default OfflineBanner;
