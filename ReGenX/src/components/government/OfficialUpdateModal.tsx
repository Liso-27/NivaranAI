import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { BMC_WARDS } from '../../data/bmcWards';
import { MitigationStatus, OfficialFieldUpdate } from '../../types';
import { 
  X, 
  ShieldAlert, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Building2,
  Info
} from 'lucide-react';

interface OfficialUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWardId?: number;
}

export const OfficialUpdateModal: React.FC<OfficialUpdateModalProps> = ({ 
  isOpen, 
  onClose,
  defaultWardId = 57
}) => {
  const { hazardZones, crowdReports, submitOfficialUpdate } = useDisasterData();
  const { user } = useAuth();

  const [wardId, setWardId] = useState<number>(defaultWardId);
  const [mitigationStatus, setMitigationStatus] = useState<MitigationStatus>('PARTIALLY_MITIGATED');
  const [remarks, setRemarks] = useState('');
  const [pumpsDeployed, setPumpsDeployed] = useState(3);
  const [shelterActivated, setShelterActivated] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentZone = hazardZones.find(z => z.ward_id === wardId);
  const wardReports = crowdReports.filter(r => r.ward_id === wardId);

  // Section 23: Conflict Detection
  // If Government sets: MITIGATED/RESOLVED but citizens report: STILL AFFECTED
  const hasCitizenConflict = 
    (mitigationStatus === 'FULLY_MITIGATED' || mitigationStatus === 'RESOLVED') &&
    wardReports.some(r => r.waterlogging_present === 'YES' || r.road_passable === 'NO');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ward = BMC_WARDS.find(w => w.ward_id === wardId);

    try {
      await submitOfficialUpdate({
        ward_id: wardId,
        ward_name: ward?.ward_name || `Ward #${wardId}`,
        official_name: user?.name || 'BMC Duty Officer',
        official_department: user?.department || 'BMC Disaster Management Cell',
        status: mitigationStatus,
        remarks: remarks || `Operational mitigation updated to ${mitigationStatus}.`,
        pumps_deployed: pumpsDeployed,
        shelter_activated: shelterActivated
      });

      onClose();
    } catch (e) {
      alert('Failed to publish field update');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800 max-w-xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#D9D6CF] dark:border-slate-800 flex items-center justify-between bg-[#F9F7F3] dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#8A9A86] rounded-md text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#2F3E46] dark:text-white font-heading">
                Publish Official Field Mitigation Update
              </h3>
              <p className="text-[11px] text-[#66736F] dark:text-slate-400">
                Authorized BMC operational status bulletin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[#F3EFEA] dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Ward Picker */}
          <div>
            <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Target Ward</label>
            <select
              value={wardId}
              onChange={(e) => setWardId(Number(e.target.value))}
              className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-md px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
            >
              {BMC_WARDS.map(w => (
                <option key={w.ward_id} value={w.ward_id}>
                  Ward #{w.ward_id}: {w.ward_name} ({w.zone})
                </option>
              ))}
            </select>
          </div>

          {/* Section 22: Dual Display Card (Analytical vs Official) */}
          <div className="p-3.5 bg-[#F9F7F3] dark:bg-slate-950 rounded-md border border-[#D9D6CF] dark:border-slate-800 space-y-2">
            <span className="font-bold text-[#2F3E46] dark:text-white block uppercase tracking-wider text-[11px]">
              Dual Status State Verification
            </span>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-[#FFFDF9] dark:bg-slate-900 rounded-md border border-[#D9D6CF] dark:border-slate-800">
                <span className="text-[#66736F] dark:text-slate-400 block text-[10px]">Analytical Risk (Source of Truth)</span>
                <strong className="text-xs font-bold text-[#C53030]">
                  {currentZone ? `${currentZone.severity} (${currentZone.risk_score}/100)` : 'LOW RISK (0/100)'}
                </strong>
              </div>

              <div className="p-2.5 bg-[#FFFDF9] dark:bg-slate-900 rounded-md border border-[#D9D6CF] dark:border-slate-800">
                <span className="text-[#66736F] dark:text-slate-400 block text-[10px]">Official Mitigation Status</span>
                <strong className="text-xs font-bold text-[#8A9A86]">
                  {mitigationStatus.replace('_', ' ')}
                </strong>
              </div>
            </div>
            <p className="text-[10px] text-[#66736F] dark:text-slate-400 leading-tight">
              * Official mitigation reports do not alter analytical risk formulas. Both statuses remain visible to citizens.
            </p>
          </div>

          {/* Section 23: Conflict Warning Banner */}
          {hasCitizenConflict && (
            <div className="p-3 bg-[#C68A27]/10 border border-[#C68A27]/30 rounded-md text-[#C68A27] dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C68A27] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">⚠️ CONFLICTING REPORTS DETECTED</strong>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  You are setting status to <strong>{mitigationStatus}</strong>, but citizens have active reports indicating waterlogging or road blockages in this ward. Both sources will remain visible on the public dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Status Picker */}
          <div>
            <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Select Mitigation State</label>
            <select
              value={mitigationStatus}
              onChange={(e) => setMitigationStatus(e.target.value as any)}
              className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-md px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
            >
              <option value="CONFIRMED">CONFIRMED (Incident Active & Verified)</option>
              <option value="PARTIALLY_MITIGATED">PARTIALLY_MITIGATED (Dewatering / Rescue in Progress)</option>
              <option value="FULLY_MITIGATED">FULLY_MITIGATED (Hazard Cleared by Municipal Teams)</option>
              <option value="RESOLVED">RESOLVED (Normal Conditions Restored)</option>
              <option value="INCORRECT_REPORT">INCORRECT_REPORT (False Ground Submission)</option>
              <option value="DISPUTED">DISPUTED (Contested Field Condition)</option>
            </select>
          </div>

          {/* Pumps & Shelter Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Dewatering Pumps Active</label>
              <input
                type="number"
                min="0"
                max="50"
                value={pumpsDeployed}
                onChange={(e) => setPumpsDeployed(Number(e.target.value))}
                className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-md px-3 py-2 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
              />
            </div>

            <div className="flex flex-col justify-between">
              <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Relief Shelter Activated</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F9F7F3] dark:bg-slate-950 rounded-md border border-[#D9D6CF] dark:border-slate-800 h-9">
                <input
                  type="checkbox"
                  checked={shelterActivated}
                  onChange={(e) => setShelterActivated(e.target.checked)}
                  className="w-4 h-4 accent-[#B86B52] rounded cursor-pointer"
                />
                <span className="text-[#2F3E46] dark:text-slate-300 text-xs">Active Evacuation</span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[#2F3E46] dark:text-slate-300 font-semibold mb-1">Official Remarks & Citizen Advisory</label>
            <textarea
              rows={3}
              required
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 4 heavy-duty dewatering pumps deployed at Bomikhal canal junction. Traffic diverted to Janpath..."
              className="w-full bg-[#FFFDF9] dark:bg-slate-950 border border-[#D9D6CF] dark:border-slate-800 rounded-md p-2.5 text-[#2F3E46] dark:text-white focus:outline-none focus:border-[#8A9A86]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#8A9A86] hover:bg-[#778873] text-white rounded-md font-bold transition flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8A9A86]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Publishing...' : 'Broadcast Official Field Update'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
