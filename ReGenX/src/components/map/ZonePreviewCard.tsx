import React from 'react';
import { HazardZone, SEVERITY_BG_CLASSES } from '../../types';
import { 
  Flame, 
  Waves, 
  CloudRain, 
  Zap, 
  AlertTriangle, 
  ArrowRight, 
  X,
  AlertCircle
} from 'lucide-react';

interface ZonePreviewCardProps {
  zone: HazardZone;
  onClose: () => void;
  onViewMoreDetails: () => void;
}

export const ZonePreviewCard: React.FC<ZonePreviewCardProps> = ({ 
  zone, 
  onClose, 
  onViewMoreDetails 
}) => {
  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'flood': return <Waves className="w-5 h-5 text-sky-500" />;
      case 'heavy_rainfall': return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'waterlogging': return <Waves className="w-5 h-5 text-cyan-500" />;
      case 'lightning': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'cyclone': return <Flame className="w-5 h-5 text-rose-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const isEmergency = zone.severity === 'EMERGENCY';

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-30 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3.5 relative transition-colors duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header & Severity */}
        <div className="flex items-start gap-3 pr-6">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            {getHazardIcon(zone.hazard_type)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${SEVERITY_BG_CLASSES[zone.severity]}`}>
                {zone.severity}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Ward #{zone.ward_id}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-heading mt-1">
              {zone.ward_name}
            </h3>
          </div>
        </div>

        {/* Analytical Risk Scores */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-center">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Risk Score</span>
            <span className="text-sm md:text-base font-black" style={{ color: zone.color }}>
              {zone.risk_score}/100
            </span>
          </div>

          <div className="border-x border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Confidence</span>
            <span className="text-sm md:text-base font-black text-cyan-600 dark:text-cyan-400">
              {zone.confidence}%
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Radius</span>
            <span className="text-sm md:text-base font-black text-amber-600 dark:text-amber-400">
              {zone.affected_radius_km} km
            </span>
          </div>
        </div>

        {/* Prominent Action Callout */}
        {zone.recommended_action && (
          <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
            isEmergency 
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800' 
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 text-[11px] font-semibold leading-tight">
              <strong>Action:</strong> {zone.recommended_action}
            </p>
          </div>
        )}

        {/* Hazard Summary Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
          {zone.description || zone.short_description}
        </p>

        {/* Action Button */}
        <button
          onClick={onViewMoreDetails}
          className="w-full py-2.5 bg-[#8A9A86] hover:bg-[#778873] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
        >
          <span>VIEW FULL ASSESSMENT & SHELTERS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
