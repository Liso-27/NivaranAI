import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { VerificationState, CrowdReport } from '../../types';
import { TranslationKey } from '../../i18n/translations/en';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Filter, 
  Search, 
  Send,
  Radio,
  FileSpreadsheet,
  Check
} from 'lucide-react';

const SOS_PROBLEM_KEY_MAP: Record<string, TranslationKey> = {
  'Trapped / Stuck': 'sos.problemTrapped',
  'Medical Emergency / Injured': 'sos.problemMedical',
  'Fire': 'sos.problemFire',
  'Flooding / Water Rising': 'sos.problemFlooding',
  'Building Damage': 'sos.problemBuildingDamage',
  'Road Blocked': 'sos.problemRoadBlocked',
  'Power Outage': 'sos.problemPowerOutage',
  'Other': 'sos.problemOther',
  'Citizen requesting immediate help': 'sos.citizenRequestingHelp',
};

const parseSosProblems = (desc?: string): string[] => {
  if (!desc) return [];
  const prefixWithSpace = '🆘 SOS EMERGENCY: ';
  const prefixNoSpace = '🆘 SOS EMERGENCY:';
  let text = '';
  if (desc.startsWith(prefixWithSpace)) {
    text = desc.slice(prefixWithSpace.length);
  } else if (desc.startsWith(prefixNoSpace)) {
    text = desc.slice(prefixNoSpace.length);
  } else {
    return [];
  }
  return text.split(', ').map((s) => s.trim()).filter(Boolean);
};

export const ReportTriageView: React.FC = () => {
  const { crowdReports, verifyCrowdReport } = useDisasterData();
  const { user } = useAuth();
  const { t, tWard, tVerification, tx, formatDateTime } = useLanguage();

  const [filterState, setFilterState] = useState<string>('ALL');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [officialNotes, setOfficialNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const formatReportTimestamp = (rawTs?: string): string => {
    if (!rawTs) return t('common.dateUnavailable');
    try {
      const d = new Date(rawTs);
      if (!isNaN(d.getTime())) {
        return formatDateTime(d, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
      }
      const cleaned = rawTs.replace(' ', 'T').split('.')[0] + 'Z';
      const d2 = new Date(cleaned);
      if (!isNaN(d2.getTime())) {
        return formatDateTime(d2, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
      }
      return t('common.dateUnavailable');
    } catch {
      return t('common.dateUnavailable');
    }
  };

  const getSosProblemLabel = (prob: string): string => {
    const key = SOS_PROBLEM_KEY_MAP[prob];
    if (key) {
      try {
        return t(key);
      } catch {
        return prob;
      }
    }
    return tx(prob) || prob;
  };

  const filteredReports = crowdReports
    .filter(r => {
      if (filterState === 'ALL') return true;
      if (filterState === 'UNVERIFIED') {
        return !r.verification_state || r.verification_state === 'UNVERIFIED';
      }
      return r.verification_state === filterState;
    })
    .sort((a, b) => {
      const aSos = a.description?.startsWith('🆘 SOS EMERGENCY:') ? 1 : 0;
      const bSos = b.description?.startsWith('🆘 SOS EMERGENCY:') ? 1 : 0;
      return bSos - aSos;
    });

  const handleAction = async (reportId: string, newState: VerificationState) => {
    try {
      await verifyCrowdReport(
        reportId, 
        newState, 
        officialNotes || `Status updated to ${newState} by ${user?.name || 'Authorized Official'}`,
        user?.name || 'BMC Duty Officer'
      );

      let successMsg = t('triage.feedbackUpdated', { state: tVerification(newState) });
      if (newState === 'VERIFIED') successMsg = t('triage.feedbackApproved');
      else if (newState === 'DISPUTED') successMsg = t('triage.feedbackDisapproved');
      else if (newState === 'MARKED') successMsg = t('triage.feedbackMarked');
      else if (newState === 'CANCELLED') successMsg = t('triage.feedbackCancelled');

      setFeedback({ type: 'success', message: successMsg });
      setTimeout(() => setFeedback(null), 4000);
      setActiveReportId(null);
      setOfficialNotes('');
    } catch (err: any) {
      console.error('Report triage action failed:', err);
      setFeedback({ type: 'error', message: t('triage.feedbackFailed', { error: err.message || 'API request failed.' }) });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6 transition-colors duration-200">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 border rounded-lg text-xs font-semibold flex items-center justify-between ${
          feedback.type === 'error'
            ? 'bg-[#DC2626]/10 border-[#DC2626]/30 text-[#DC2626]'
            : 'bg-[#059669]/10 border-[#059669]/30 text-[#059669]'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:underline cursor-pointer">
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#D97706] rounded-lg text-white">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] dark:text-white">
              {t('triage.title')}
            </h2>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 font-medium">
            {t('triage.subtitle')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {[
            { id: 'ALL', label: t('triage.filterAll') },
            { id: 'UNVERIFIED', label: t('triage.filterUnverified') },
            { id: 'VERIFIED', label: t('triage.filterVerified') },
            { id: 'DISPUTED', label: t('triage.filterDisputed') },
            { id: 'MARKED', label: t('triage.filterMarked') },
            { id: 'CANCELLED', label: t('triage.filterCancelled') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterState(tab.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition border cursor-pointer ${
                filterState === tab.id
                  ? 'bg-[#D97706] text-white border-[#D97706]'
                  : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800 hover:bg-[#F8F9FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Queue */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg text-xs text-[#475569] dark:text-slate-400">
            {t('triage.noReportsFound', {
              filter: filterState === 'ALL'
                ? t('common.all')
                : filterState === 'UNVERIFIED'
                ? t('triage.filterUnverified')
                : filterState === 'VERIFIED'
                ? t('triage.filterVerified')
                : filterState === 'DISPUTED'
                ? t('triage.filterDisputed')
                : filterState === 'MARKED'
                ? t('triage.filterMarked')
                : t('triage.filterCancelled')
            })}
          </div>
        ) : (
          filteredReports.map(report => {
            const isSos = report.description?.startsWith('🆘 SOS EMERGENCY:');
            return (
              <div
                key={report.id}
                className={`bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border space-y-4 ${
                  isSos
                    ? 'border-[#DC2626] dark:border-[#DC2626] ring-1 ring-[#DC2626]/30 shadow-md'
                    : 'border-[#D1D5DB] dark:border-slate-800'
                }`}
              >
              {/* Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D1D5DB] dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[#0F172A] dark:text-slate-200 text-xs font-semibold">
                    {t('common.ward')} #{report.ward_id || 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{tWard(report.ward_id, report.ward_name || `Ward ${report.ward_id}`)}</h4>
                    <span className="text-[11px] text-[#475569] dark:text-slate-400">
                      {t('triage.reporter')} <strong className="text-[#0F172A] dark:text-slate-300">{report.reported_by_name || t('role.CITIZEN')}</strong> • {t('triage.corroborationsCount', { count: report.corroboration_count ?? 1 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSos && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-[#DC2626] dark:text-rose-400 shrink-0" />
                      <span>{t('triage.sosBadge')}</span>
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    report.verification_state === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      : report.verification_state === 'DISPUTED'
                      ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                      : report.verification_state === 'MARKED'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30'
                      : report.verification_state === 'CANCELLED'
                      ? 'bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600'
                      : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                  }`}>
                    {tVerification(report.verification_state || 'UNVERIFIED')}
                  </span>
                  <span className="text-[11px] text-[#475569] dark:text-slate-400 font-medium">
                    {formatReportTimestamp(report.timestamp || report.created_at)}
                  </span>
                </div>
              </div>

              {/* Description & Structured Answers */}
              <div className="space-y-2">
                {isSos && parseSosProblems(report.description).length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {parseSosProblems(report.description).map((prob, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 rounded text-[11px] font-bold"
                      >
                        {getSosProblemLabel(prob)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#0F172A] dark:text-slate-300 leading-normal font-medium">
                    "{tx(report.description)}"
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 bg-[#F8F9FA] dark:bg-slate-800/80 rounded border border-[#D1D5DB] dark:border-slate-700 text-[#0F172A] dark:text-slate-300">
                    {t('triage.waterlogging')} <strong>{report.waterlogging_present === 'YES' ? t('common.yes') : report.waterlogging_present === 'NO' ? t('common.no') : (report.waterlogging_present || t('common.unknown'))}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-[#F8F9FA] dark:bg-slate-800/80 rounded border border-[#D1D5DB] dark:border-slate-700 text-[#0F172A] dark:text-slate-300">
                    {t('triage.roadsPassable')} <strong>{report.road_passable === 'YES' ? t('common.yes') : report.road_passable === 'NO' ? t('common.no') : (report.road_passable || t('common.unknown'))}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-[#F8F9FA] dark:bg-slate-800/80 rounded border border-[#D1D5DB] dark:border-slate-700 text-[#0F172A] dark:text-slate-300">
                    {t('triage.powerOutage')} <strong>{report.power_outage === 'YES' ? t('common.yes') : report.power_outage === 'NO' ? t('common.no') : (report.power_outage || t('common.unknown'))}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-[#F8F9FA] dark:bg-slate-800/80 rounded border border-[#D1D5DB] dark:border-slate-700 text-[#0F172A] dark:text-slate-300">
                    {t('triage.structuralDamage')} <strong>{report.structural_damage === 'YES' ? t('common.yes') : report.structural_damage === 'NO' ? t('common.no') : (report.structural_damage || t('common.unknown'))}</strong>
                  </span>
                </div>
              </div>

              {/* Triage Action Panel */}
              <div className="pt-3 border-t border-[#D1D5DB] dark:border-slate-800 space-y-3">
                {activeReportId === report.id ? (
                  <div className="space-y-2 text-xs">
                    <textarea
                      rows={2}
                      placeholder={t('triage.remarksPlaceholder')}
                      value={officialNotes}
                      onChange={(e) => setOfficialNotes(e.target.value)}
                      className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md p-2.5 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
                    />
                    <div className="flex items-center gap-2 justify-end flex-wrap">
                      <button
                        onClick={() => setActiveReportId(null)}
                        className="px-3 py-1.5 text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white font-semibold cursor-pointer"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'CANCELLED')}
                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-md font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> {t('triage.markCancelled')}
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'MARKED')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" /> {t('triage.markAction')}
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'DISPUTED')}
                        className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-md font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t('triage.disproveDispute')}
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'VERIFIED')}
                        className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('triage.verifyObservation')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#475569] dark:text-slate-400 font-medium">
                      {(report.official_notes || report.official_remarks || report.official_note) ? (
                        <span className="text-[#059669] font-bold">
                          {t('triage.officialRemarks')} "{report.official_notes || report.official_remarks || report.official_note}"
                        </span>
                      ) : (
                        t('triage.noNotes')
                      )}
                    </span>
                    <button
                      onClick={() => {
                        setActiveReportId(report.id);
                        setOfficialNotes(report.official_notes || report.official_remarks || report.official_note || '');
                      }}
                      className="px-3 py-1.5 bg-[#F8F9FA] hover:bg-[#E2E8F0] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white rounded-md text-xs font-semibold transition border border-[#D1D5DB] dark:border-slate-700 cursor-pointer"
                    >
                      {t('triage.performReview')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};
