import React from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Radio, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Clock, 
  ThumbsUp, 
  MapPin, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

export const CitizenReportsHistory: React.FC = () => {
  const { crowdReports, corroborateCrowdReport } = useDisasterData();
  const { user } = useAuth();


  const getVerificationBadge = (state: string) => {
    switch (state) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> BMC Official Verified
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> Disputed / Disproved
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30">
            <AlertCircle className="w-3 h-3" /> Report Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
            <HelpCircle className="w-3 h-3" /> Pending Field Triage
          </span>
        );
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6 animate-fade-in transition-colors duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 bg-[#B86B52] rounded-xl text-white">
            <Radio className="w-5 h-5" />
          </span>
          <h2 className="text-xl md:text-2xl font-black text-[#2F3E46] dark:text-white font-heading">
            Citizen Ground Observations Feed
          </h2>
        </div>
        <p className="text-xs text-[#66736F] dark:text-slate-400 mt-1">
          Crowdsourced ground verifications with corroboration counters and official BMC review notes.
        </p>
      </div>

      {/* Reports Feed */}
      <div className="space-y-4">
        {crowdReports.map(report => (
          <div
            key={report.id}
            className="bg-[#FFFDF9] dark:bg-slate-900 rounded-lg p-5 border border-[#D9D6CF] dark:border-slate-800 shadow-2xs space-y-4 hover:border-[#8A9A86] hover:shadow-md transition-all duration-200"
          >
            {/* Top Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D6CF] dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold text-[#2F3E46] dark:text-white font-heading">
                  {report.ward_name} (Ward #{report.ward_id})
                </strong>
                {getVerificationBadge(report.verification_state)}
              </div>

              <div className="flex items-center gap-3 text-[#66736F] dark:text-slate-500 text-[11px]">
                {report.landmark && <span>📍 {report.landmark}</span>}
                <span>{new Date(report.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>

            {/* Observation Text */}
            <p className="text-xs text-[#2F3E46] dark:text-slate-300 italic bg-[#F9F7F3] dark:bg-slate-950 p-3 rounded-xl border border-[#D9D6CF] dark:border-slate-800/60 leading-relaxed">
              "{report.description}"
            </p>

            {/* Responses Grid (Section 9) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-[#F9F7F3] dark:bg-slate-950 rounded-lg border border-[#D9D6CF] dark:border-slate-800/80">
                <span className="text-[10px] text-[#66736F] block">Waterlogging Present</span>
                <span className={`font-black ${report.waterlogging_present === 'YES' ? 'text-[#C53030]' : 'text-[#2F3E46] dark:text-slate-300'}`}>
                  {report.waterlogging_present} {report.waterlogging_depth_cm ? `(${report.waterlogging_depth_cm}cm)` : ''}
                </span>
              </div>

              <div className="p-2 bg-[#F9F7F3] dark:bg-slate-950 rounded-lg border border-[#D9D6CF] dark:border-slate-800/80">
                <span className="text-[10px] text-[#66736F] block">Road Passable</span>
                <span className={`font-black ${report.road_passable === 'NO' ? 'text-[#C53030]' : 'text-[#4D8B63]'}`}>
                  {report.road_passable}
                </span>
              </div>

              <div className="p-2 bg-[#F9F7F3] dark:bg-slate-950 rounded-lg border border-[#D9D6CF] dark:border-slate-800/80">
                <span className="text-[10px] text-[#66736F] block">Power Outage</span>
                <span className={`font-black ${report.power_outage === 'YES' ? 'text-[#C68A27]' : 'text-[#2F3E46] dark:text-slate-300'}`}>
                  {report.power_outage}
                </span>
              </div>

              <div className="p-2 bg-[#F9F7F3] dark:bg-slate-950 rounded-lg border border-[#D9D6CF] dark:border-slate-800/80">
                <span className="text-[10px] text-[#66736F] block">Structural Damage</span>
                <span className={`font-black ${report.structural_damage === 'YES' ? 'text-[#C53030]' : 'text-[#2F3E46] dark:text-slate-300'}`}>
                  {report.structural_damage}
                </span>
              </div>
            </div>

            {/* Official Review Notes (Section 11) */}
            {(report.official_notes || report.official_note) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#0B3D91] dark:text-cyan-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Official BMC Review Note ({report.reviewed_by_name || 'Emergency Duty Officer'})

                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {report.official_notes || report.official_note}
                </p>
              </div>
            )}

            {/* Bottom Actions: Corroboration & Reporter Info */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Reported by: <strong className="text-slate-800 dark:text-slate-300">{report.reported_by_name}</strong></span>

              <button
                onClick={() => corroborateCrowdReport(report.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[#F58220]" />
                <span>Corroborate ({report.corroboration_count || report.corroborations_count || 0})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
