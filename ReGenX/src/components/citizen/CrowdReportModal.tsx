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
  HelpCircle,
  Camera,
  Info
} from 'lucide-react';

interface CrowdReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrowdReportModal: React.FC<CrowdReportModalProps> = ({ isOpen, onClose }) => {
  const { userLocation, submitCrowdReport } = useDisasterData();
  const { user, isAuthenticated } = useAuth();

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
        waterlogging_depth_cm: waterloggingDepthCm,
        road_passable: roadPassable,
        power_outage: powerOutage,
        structural_damage: structuralDamage,
        description: descClean
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to submit report. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-[#F58220] rounded-xl text-white">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
                Citizen Ground Observation Survey
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct ground verification feed (Separate from risk engine)
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

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white font-heading">
              Observation Submitted Successfully!
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs">
              Thank you for contributing. Your observation has been dispatched to the BMC emergency triage queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {validationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
            {/* Ward Selector */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Select Observed BMC Ward
              </label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91] dark:focus:border-[#F58220]"
              >
                {BMC_WARDS.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>
                    Ward #{w.ward_id}: {w.ward_name} ({w.zone})
                  </option>
                ))}
              </select>
            </div>

            {/* Section 10: Structured Questions (YES / NO / UNKNOWN) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px]">
                Ground Condition Checklist
              </span>

              {/* Waterlogging */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 dark:text-slate-300">Is waterlogging present?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setWaterloggingPresent(opt)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                        waterloggingPresent === opt
                          ? opt === 'YES' ? 'bg-amber-600 text-white' : 'bg-[#0B3D91] text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Road Passable */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 dark:text-slate-300">Are primary roads passable?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setRoadPassable(opt)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                        roadPassable === opt
                          ? opt === 'NO' ? 'bg-rose-600 text-white' : 'bg-[#0B3D91] text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Power Outage */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 dark:text-slate-300">Electricity / Power Outage?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPowerOutage(opt)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                        powerOutage === opt
                          ? opt === 'YES' ? 'bg-amber-600 text-white' : 'bg-[#0B3D91] text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Structural Damage */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-700 dark:text-slate-300">Trees fallen or structural damage?</span>
                <div className="flex gap-1">
                  {(['YES', 'NO', 'UNKNOWN'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStructuralDamage(opt)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                        structuralDamage === opt
                          ? opt === 'YES' ? 'bg-rose-600 text-white' : 'bg-[#0B3D91] text-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
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
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Estimated Inundation Depth: <strong className="text-cyan-600 dark:text-cyan-400">{waterloggingDepthCm} cm</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={waterloggingDepthCm}
                  onChange={(e) => setWaterloggingDepthCm(Number(e.target.value))}
                  className="w-full accent-[#0B3D91] dark:accent-cyan-400"
                />
              </div>
            )}

            {/* Observations Description */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Detailed Situation Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current street conditions, drain overflow, or emergency needs..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B3D91] dark:focus:border-[#F58220]"
              />
            </div>

            {/* Source Truth Reminder */}
            <div className="p-3 bg-blue-50 dark:bg-sky-500/10 border border-blue-200 dark:border-sky-500/30 rounded-xl text-[11px] text-blue-800 dark:text-sky-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-[#0B3D91] dark:text-sky-400 shrink-0 mt-0.5" />
              <span>
                Note: Ground reports are displayed alongside official data and reviewed in the triage queue. They do not alter backend mathematical risk formulas.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2"
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
