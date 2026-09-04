import React from 'react';
import { formatBulletinDate } from '../citizen/NewsFeedView';
import { HazardZone, SEVERITY_BG_CLASSES } from '../../types';
import { useDisasterData } from '../../context/DisasterDataContext';
import { 
  X, 
  CloudRain, 
  ShieldAlert, 
  ExternalLink,
  AlertTriangle,
  Flame,
  MapPin,
  Clock
} from 'lucide-react';

interface ZoneDetailModalProps {
  zone: HazardZone;
  isOpen: boolean;
  onClose: () => void;
}

export const ZoneDetailModal: React.FC<ZoneDetailModalProps> = ({ zone, isOpen, onClose }) => {
  const { safePlaces, newsArticles } = useDisasterData();

  if (!isOpen) return null;

  const wardNum = typeof zone.ward_id === 'number' ? zone.ward_id : (parseInt(String(zone.ward_id || '').replace(/\D/g, ''), 10) || 1);

  // Safe places in this ward or nearby
  const nearbySafePlaces = safePlaces.filter(
    p => p.ward_id === wardNum || String(p.ward_id) === String(zone.ward_id) || (p.distance_km !== undefined && p.distance_km < 3)
  );

  // Zone-specific news
  const zoneNews = newsArticles.filter(n => n.ward_id === wardNum || String(n.ward_id) === String(zone.ward_id));

  const isEmergency = zone.severity === 'EMERGENCY';
  const isHigh = zone.severity === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FFFDF9] dark:bg-slate-900 rounded-lg border border-[#D9D6CF] dark:border-slate-800 max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#D9D6CF] dark:border-slate-800 flex items-center justify-between bg-[#F9F7F3] dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg text-white ${isEmergency ? 'bg-[#C53030] animate-pulse' : isHigh ? 'bg-[#C85A32]' : 'bg-[#8A9A86]'}`}>
              {isEmergency ? <Flame className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${SEVERITY_BG_CLASSES[zone.severity]}`}>
                  {zone.severity} SEVERITY
                </span>
                <span className="text-xs text-[#66736F] dark:text-slate-400">
                  Ward #{wardNum} • Centroid: [{(zone.centroid_lat ?? zone.latitude ?? 20.2961).toFixed(4)}, {(zone.centroid_lng ?? zone.longitude ?? 85.8245).toFixed(4)}]
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-[#2F3E46] dark:text-white font-heading mt-0.5">
                {zone.ward_name} Detailed Incident Assessment
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 1. PROMINENT RECOMMENDED ACTION CALLOUT (Requirement 4) */}
          {zone.recommended_action && (
            <div className={`p-4 rounded-lg border-2 shadow-sm animate-fade-in ${
              isEmergency 
                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-100' 
                : isHigh 
                ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-500 text-orange-950 dark:text-orange-100' 
                : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  isEmergency ? 'bg-rose-500 text-white' : isHigh ? 'bg-orange-500 text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      CIVIL DEFENSE DIRECTIVE • RECOMMENDED CITIZEN ACTION
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white/60 dark:bg-black/40 border border-current">
                      High Priority
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-bold leading-relaxed">
                    {zone.recommended_action}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Top Analytical Risk Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Risk Score</span>
              <span className="text-2xl font-black" style={{ color: zone.color }}>
                {zone.risk_score}/100
              </span>
              <span className="text-[10px] text-slate-500 block">BMC Calibrated</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Confidence</span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {zone.confidence}%
              </span>
              <span className="text-[10px] text-slate-500 block">Sensor Validation</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Affected Radius</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {zone.affected_radius_km} km
              </span>
              <span className="text-[10px] text-slate-500 block">Perimeter Bound</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Hazard Category</span>
              <span className="text-base font-black text-slate-900 dark:text-white capitalize block mt-1">
                {(zone.hazard_type || 'HAZARD').replace('_', ' ')}
              </span>
              <span className="text-[10px] text-slate-500 block">Active Status</span>
            </div>
          </div>

          {/* 3. Description Overview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
              Incident Summary
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {zone.description || zone.short_description}
            </p>
          </div>

          {/* 4. Meteorological & Hydrological Sensor Telemetry */}
          {(zone.weather_metrics || zone.weather_data) && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-[#0B3D91] dark:text-cyan-400" />
                Live Sensor & Meteorological Telemetry
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Precipitation Rate</span>
                  <strong className="text-sm font-black text-blue-600 dark:text-sky-400">
                    {zone.weather_metrics?.rainfall_mm_per_hr ?? zone.weather_data?.rainfall_mm ?? 18} mm/hr
                  </strong>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Water Inundation Depth</span>
                  <strong className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                    {zone.weather_metrics?.water_depth_cm ?? zone.weather_data?.water_level_cm ?? 45} cm
                  </strong>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Wind Velocity</span>
                  <strong className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {zone.weather_metrics?.wind_speed_kmh ?? zone.weather_data?.wind_speed_kmh ?? 38} km/h
                  </strong>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ambient Temp</span>
                  <strong className="text-sm font-black text-slate-800 dark:text-slate-300">
                    {zone.weather_metrics?.temperature_c ?? zone.weather_data?.temperature_c ?? 29}°C
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* 5. Zone-Specific News */}
          {zoneNews.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
                Zone-Specific Bulletins ({zone.ward_name})
              </h3>
              <div className="space-y-2">
                {zoneNews.map(news => (
                  <div
                    key={news.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-500/30">
                        {news.locality}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatBulletinDate(news.published_at)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{news.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{news.summary || news.overview}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Evacuation Shelters & Relief Camps Near This Ward */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider flex items-center justify-between">
              <span>Designated Safe Shelters & Relief Camps Near Ward #{zone.ward_id}</span>
              <span className="text-[10px] text-slate-500">{nearbySafePlaces.length} Facilities Available</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbySafePlaces.map(place => (
                <div
                  key={place.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-heading">{place.name}</strong>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                      {place.distance_km} km
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{place.address}</span>
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      {place.total_capacity - place.occupied_capacity} spots free
                    </span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0B3D91] dark:text-sky-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last Updated: {zone.last_updated ? new Date(zone.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Assessment
          </button>
        </div>
      </div>
    </div>
  );
};
