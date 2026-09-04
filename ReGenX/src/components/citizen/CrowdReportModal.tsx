import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { BMC_WARDS } from '../../data/bmcWards';
import { 
  X, 
  Radio, 
  Send, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Info
} from 'lucide-react';

interface CrowdReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrowdReportModal: React.FC<CrowdReportModalProps> = ({ isOpen, onClose }) => {
  const { userLocation, submitCrowdReport } = useDisasterData();
  const { user } = useAuth();

  const [selectedWardId, setSelectedWardId] = useState<number>(userLocation.ward_id || 57);
  const [description, setDescription] = useState('');
  const [waterloggingDepthCm, setWaterloggingDepthCm] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Structured Survey Questions (YES / NO / UNKNOWN)
  const [waterloggingPresent, setWaterloggingPresent] = useState<'YES' | 'NO' | 'UNKNOWN'>('YES');
  const [roadPassable, setRoadPassable] = useState<'YES' | 'NO' | 'UNKNOWN'>('NO');
  const [powerOutage, setPowerOutage] = useState<'YES' | 'NO' | 'UNKNOWN'>('YES');
  const [structuralDamage, setStructuralDamage] = useState<'YES' | 'NO' | 'UNKNOWN'>('NO');

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setValidationError(null);

    const descClean = description.trim();
    if (!descClean) {
      setValidationError('Please provide a detailed situation description before submitting.');
      return;
    }

    if (!selectedWardId || selectedWardId < 1 || selectedWardId > 67) {
      setValidationError('Please select a valid BMC ward.');
      return;
    }

    setIsSubmitting(true);

    const selectedWard = BMC_WARDS.find(w => w.ward_id === selectedWardId);
    const obsType = waterloggingPresent === 'YES' 
      ? 'waterlogging' 
      : powerOutage === 'YES' 
      ? 'power_outage' 
      : structuralDamage === 'YES' 
      ? 'road_damage' 
      : 'flooding';

    try {
      await submitCrowdReport({
        ward_id: selectedWardId,
        ward_name: selectedWard?.ward_name || `Ward #${selectedWardId}`,
        observation_type: obsType,
        update_type: obsType,
        latitude: selectedWard?.centroid_lat || 20.2961,
        longitude: selectedWard?.centroid_lng || 85.8245,
        reported_by_name: user?.name || 'Citizen Reporter',
        reported_by_role: user?.role || 'CITIZEN',
        waterlogging_present: waterloggingPresent,
        is_road_passable: roadPassable,
        power_operational: powerOutage === 'YES' ? 'NO' : 'YES',
        description: descClean,
        waterlogging_depth_cm: waterloggingPresent === 'YES' ? waterloggingDepthCm : 0,
        assistance_needed: structuralDamage === 'YES' || roadPassable === 'NO' ? 'YES' : 'NO'
      });
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(err?.message || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#D1D5DB] dark:border-slate-800 flex items-center justify-between bg-[#0F172A] text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#D97706] text-white rounded-md">
              <Radio className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black font-heading uppercase tracking-wide text-white">
                Submit Ground Observation
              </h3>
              <p className="text-xs text-slate-300">
                Direct crowd-sourced intelligence to BMC emergency triage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#059669]" />
            </div>
            <h4 className="text-base font-black text-[#0F172A] dark:text-white font-heading">
              Observation Submitted Successfully!
            </h4>
            <p className="text-xs text-[#475569] dark:text-slate-400 max-w-xs">
              Thank you for contributing. Your observation has been dispatched to the BMC emergency triage queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-md text-[#DC2626] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
            {/* Ward Selector */}
            <div>
              <label className="block text-[#0F172A] dark:text-slate-200 font-bold mb-1">
                Select Observed BMC Ward
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              >
                {BMC_WARDS.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>
                    Ward #{w.ward_id}: {w.ward_name} ({w.zone} Zone)
                  </option>
                ))}
              </select>
            </div>

            {/* Section: Structured Questions */}
            <div className="p-4 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800 space-y-3">
              <span className="font-bold text-[#0F172A] dark:text-white block uppercase tracking-wider text-[11px]">
                Ground Condition Checklist
              </span>

              {/* Waterlogging */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#0F172A] dark:text-slate-300">Is waterlogging present?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setWaterloggingPresent(opt)}
                      className={`px-2.5 py-1 rounded font-bold text-[10px] transition border cursor-pointer ${
                        waterloggingPresent === opt
                          ? opt === 'YES' 
                            ? 'bg-[#D97706] text-white border-[#D97706]' 
                            : 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Road Passable */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#0F172A] dark:text-slate-300">Are primary roads passable?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setRoadPassable(opt)}
                      className={`px-2.5 py-1 rounded font-bold text-[10px] transition border cursor-pointer ${
                        roadPassable === opt
                          ? opt === 'NO' 
                            ? 'bg-[#DC2626] text-white border-[#DC2626]' 
                            : 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Power Outage */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#0F172A] dark:text-slate-300">Electricity / Power Outage?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPowerOutage(opt)}
                      className={`px-2.5 py-1 rounded font-bold text-[10px] transition border cursor-pointer ${
                        powerOutage === opt
                          ? opt === 'YES' 
                            ? 'bg-[#D97706] text-white border-[#D97706]' 
                            : 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Structural Damage */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#0F172A] dark:text-slate-300">Trees fallen / structural damage?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStructuralDamage(opt)}
                      className={`px-2.5 py-1 rounded font-bold text-[10px] transition border cursor-pointer ${
                        structuralDamage === opt
                          ? opt === 'YES' 
                            ? 'bg-[#DC2626] text-white border-[#DC2626]' 
                            : 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estimated Water Depth */}
            {waterloggingPresent === 'YES' && (
              <div>
                <label className="block text-[#0F172A] dark:text-slate-200 font-bold mb-1">
                  Estimated Inundation Depth: <strong className="text-[#D97706]">{waterloggingDepthCm} cm</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={waterloggingDepthCm}
                  onChange={(e) => setWaterloggingDepthCm(Number(e.target.value))}
                  className="w-full accent-[#D97706]"
                />
              </div>
            )}

            {/* Observations Description */}
            <div>
              <label className="block text-[#0F172A] dark:text-slate-200 font-bold mb-1">
                Detailed Situation Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current street conditions, drain overflow, or emergency needs..."
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md p-3 text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#D97706]"
              />
            </div>

            {/* Source Truth Reminder */}
            <div className="p-3 bg-[#F8F9FA] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md text-[11px] text-[#475569] dark:text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                Note: Ground reports are displayed alongside official data and reviewed in the triage queue. They do not alter backend mathematical risk formulas.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md font-bold text-xs transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmitting...' : 'Submit Ground Observation'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
