import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { VerificationState, CrowdReport } from '../../types';
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

const formatReportTimestamp = (rawTs?: string): string => {
  if (!rawTs) return 'Date unavailable';
  try {
    const d = new Date(rawTs);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    const cleaned = rawTs.replace(' ', 'T').split('.')[0] + 'Z';
    const d2 = new Date(cleaned);
    if (!isNaN(d2.getTime())) {
      return d2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d2.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return 'Date unavailable';
  } catch {
    return 'Date unavailable';
  }
};

export const ReportTriageView: React.FC = () => {
  const { crowdReports, verifyCrowdReport } = useDisasterData();
  const { user } = useAuth();

  const [filterState, setFilterState] = useState<string>('ALL');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [officialNotes, setOfficialNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredReports = crowdReports.filter(r => {
    if (filterState === 'ALL') return true;
    return r.verification_state === filterState;
  });

  const handleAction = async (reportId: string, newState: VerificationState) => {
    try {
      await verifyCrowdReport(
        reportId, 
        newState, 
        officialNotes || `Status updated to ${newState} by ${user?.name || 'Authorized Official'}`,
        user?.name || 'BMC Duty Officer'
      );
      setFeedback({ type: 'success', message: `Report updated to ${newState} successfully.` });
      setTimeout(() => setFeedback(null), 4000);
      setActiveReportId(null);
      setOfficialNotes('');
    } catch (err: any) {
      console.error('Report triage action failed:', err);
      setFeedback({ type: 'error', message: `Failed to update report: ${err.message || 'API request failed.'}` });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6 animate-fade-in transition-colors duration-200">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 border rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
          feedback.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700/60 text-rose-800 dark:text-rose-200'
            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0B3D91] rounded-xl text-white">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-heading">
              Citizen Report Review & Triage Desk
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Validate, corroborate, or dispute field observations submitted by citizens across 67 wards.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs">
          {[
            { id: 'ALL', label: 'All Reports' },
            { id: 'UNVERIFIED', label: 'Pending Review' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'DISPUTED', label: 'Disputed' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterState(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition border cursor-pointer ${
                filterState === tab.id
                  ? 'bg-[#0B3D91] text-white border-[#0B3D91] dark:bg-amber-600 dark:border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
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
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400">
            No reports found under the "{filterState === 'ALL' ? 'All' : filterState}" filter.
          </div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              {/* Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                    Ward #{report.ward_id || 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-heading">{report.ward_name || `Ward ${report.ward_id}`}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Reporter: <strong className="text-slate-700 dark:text-slate-300">{report.reported_by_name || 'Citizen'}</strong> • {report.corroboration_count ?? 1} corroboration(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                    report.verification_state === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      : report.verification_state === 'DISPUTED'
                      ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                      : report.verification_state === 'CANCELLED'
                      ? 'bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600'
                      : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                  }`}>
                    {report.verification_state || 'UNVERIFIED'}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    {formatReportTimestamp(report.timestamp || report.created_at)}
                  </span>
                </div>
              </div>

              {/* Description & Structured Answers */}
              <div className="space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  "{report.description}"
                </p>

                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Waterlogging: <strong>{report.waterlogging_present || 'YES'}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Roads Passable: <strong>{report.road_passable || 'YES'}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Power Outage: <strong>{report.power_outage || 'NO'}</strong>
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Structural Damage: <strong>{report.structural_damage || 'NO'}</strong>
                  </span>
                </div>
              </div>

              {/* Triage Action Panel */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                {activeReportId === report.id ? (
                  <div className="space-y-2 text-xs">
                    <textarea
                      rows={2}
                      placeholder="Enter official review remarks (e.g. BMC team dispatched, pump installed)..."
                      value={officialNotes}
                      onChange={(e) => setOfficialNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setActiveReportId(null)}
                        className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'CANCELLED')}
                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> Mark Cancelled
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'DISPUTED')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Disprove / Dispute
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'VERIFIED')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verify Observation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {(report.official_notes || report.official_remarks || report.official_note) ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          Official Remarks: "{report.official_notes || report.official_remarks || report.official_note}"
                        </span>
                      ) : (
                        'No official notes added yet.'
                      )}
                    </span>
                    <button
                      onClick={() => {
                        setActiveReportId(report.id);
                        setOfficialNotes(report.official_notes || report.official_remarks || report.official_note || '');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0B3D91] dark:text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Perform Triage Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
