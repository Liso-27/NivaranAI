import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { DisasterMap } from '../map/DisasterMap';
import { CrowdReportModal } from './CrowdReportModal';
import { ZoneDetailModal } from '../map/ZoneDetailModal';
import { HazardZone, SEVERITY_BG_CLASSES } from '../../types';
import { 
  AlertTriangle, 
  Flame, 
  Radio, 
  Navigation, 
  ArrowRight, 
  Plus, 
  X, 
  Map as MapIcon, 
  LayoutDashboard, 
  CloudRain, 
  Waves, 
  Zap, 
  Activity, 
  Crosshair, 
  Loader2, 
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { 
    userLocation, 
    requestUserLocation, 
    hazardZones, 
    safePlaces, 
    officialUpdates, 
    crowdReports,
    setSelectedZone
  } = useDisasterData();

  const [activeView, setActiveView] = useState<'OVERVIEW' | 'MAP'>('OVERVIEW');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showEvacBanner, setShowEvacBanner] = useState(true);
  const [inspectedZone, setInspectedZone] = useState<HazardZone | null>(null);

  // Find nearest safe place for user if in danger
  const nonExcludedSafePlaces = safePlaces.filter(p => !p.is_excluded_from_routing && !p.is_hazard_excluded);
  const nearestShelter = nonExcludedSafePlaces[0];

  // Statistics
  const emergencyZonesCount = hazardZones.filter(z => z.severity === 'EMERGENCY').length;
  const highZonesCount = hazardZones.filter(z => z.severity === 'HIGH').length;

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

  const handleJumpToMapZone = (zone: HazardZone) => {
    setSelectedZone(zone);
    setActiveView('MAP');
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 relative overflow-hidden bg-[#F5F7FA] dark:bg-slate-950 transition-colors duration-200">
      {/* 1. View Mode Sub-Bar (Overview vs Live Map) */}
      <div className="bg-white/95 dark:bg-slate-900/90 border-b border-slate-200/90 dark:border-slate-800/80 px-4 py-2 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'OVERVIEW'
                ? 'bg-[#0B3D91] text-white shadow-xs dark:bg-[#0B3D91] dark:text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Disaster Awareness Overview</span>
          </button>

          <button
            onClick={() => setActiveView('MAP')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'MAP'
                ? 'bg-[#0B3D91] text-white shadow-xs dark:bg-[#0B3D91] dark:text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Interactive 67-Ward Map</span>
          </button>
        </div>

        {/* GPS Quick Telemetry Tag */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          {userLocation.latitude && userLocation.longitude ? (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GPS Active: {userLocation.latitude.toFixed(4)}°N, {userLocation.longitude.toFixed(4)}°E</span>
            </div>
          ) : (
            <button
              onClick={() => requestUserLocation()}
              disabled={userLocation.isLoading}
              className="flex items-center gap-1.5 text-[#0B3D91] dark:text-cyan-400 font-bold bg-blue-50 dark:bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-cyan-500/30 hover:bg-blue-100 transition cursor-pointer"
            >
              {userLocation.isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Crosshair className="w-3 h-3" />
              )}
              <span>{userLocation.isLoading ? 'Locating...' : 'Enable GPS Location'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Immediate Evacuation Warning Banner if user in Danger */}
      {userLocation.isInsideHazardZone && showEvacBanner && (
        <div className="bg-rose-600 text-white px-4 py-3 shadow-lg z-30 flex items-center justify-between gap-3 animate-fade-in shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-white/20 rounded-xl shrink-0 animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-black font-heading tracking-wide uppercase flex items-center gap-2">
                <span>⚠️ Immediate Evacuation Advisory: High-Risk Inundation Zone!</span>
              </h3>
              <p className="text-[11px] text-rose-100 mt-0.5">
                Current Ward: <strong>{userLocation.ward_name || `Ward #${userLocation.ward_id}`}</strong>. Move immediately to higher elevation or designated relief center.
              </p>
            </div>
          </div>

          {nearestShelter && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.latitude},${nearestShelter.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-black transition shadow-sm"
              >
                <span>Navigate to {nearestShelter.name} ({nearestShelter.distance_km} km)</span>
                <Navigation className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setShowEvacBanner(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-rose-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. VIEW 1: DISASTER AWARENESS OVERVIEW */}
      {activeView === 'OVERVIEW' && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 animate-fade-in max-w-7xl mx-auto w-full">
          {/* Top Quick Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Hazards</span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                {hazardZones.length}
              </div>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                {emergencyZonesCount} Emergency, {highZonesCount} High Risk
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">BMC Ward Coverage</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                67 Wards
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                100% Geo-Centroids Monitored
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Citizen Reports</span>
                <Radio className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                {crowdReports.length}
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                {crowdReports.filter(r => r.verification_state === 'VERIFIED').length} Verified Ground Observations
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-blue-600 dark:text-cyan-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Official Field Actions</span>
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                {officialUpdates.length}
              </div>
              <p className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold">
                BMC Pumps & Response Active
              </p>
            </div>
          </div>

          {/* Critical Recommended Actions Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30 border border-rose-200 dark:border-rose-800/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-heading uppercase tracking-wide">
                  Top Recommended Actions & Civil Defense Advisories
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 font-mono">
                BMC Source of Truth
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {hazardZones.slice(0, 4).map(zone => (
                <div 
                  key={zone.id}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      {getHazardIcon(zone.hazard_type)}
                      {zone.ward_name}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${SEVERITY_BG_CLASSES[zone.severity]}`}>
                      {zone.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    👉 {zone.recommended_action || zone.short_description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Radius: {zone.affected_radius_km} km</span>
                    <button
                      onClick={() => handleJumpToMapZone(zone)}
                      className="text-[#0B3D91] dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Locate on Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Hazards Grid with Direct Inspect & Map Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
                  Active Hazard Zones in Bhubaneswar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data-calibrated hazard severity and affected perimeters across 67 wards.
                </p>
              </div>

              <button
                onClick={() => setActiveView('MAP')}
                className="px-3.5 py-2 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>View Full Map</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hazardZones.map(zone => (
                <div
                  key={zone.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {getHazardIcon(zone.hazard_type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${SEVERITY_BG_CLASSES[zone.severity]}`}>
                              {zone.severity}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Ward #{zone.ward_id}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white font-heading mt-0.5">
                            {zone.ward_name}
                          </h4>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Risk Score</span>
                        <span className="text-sm font-black" style={{ color: zone.color }}>
                          {zone.risk_score}/100
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {zone.description || zone.short_description}
                    </p>

                    {/* Sensor Telemetry Snippet */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Affected Radius</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-black">{zone.affected_radius_km} km</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Rainfall / Inundation</span>
                        <strong className="text-blue-600 dark:text-sky-400 font-black">
                          {zone.weather_data?.rainfall_mm ?? 45}mm • {zone.weather_data?.water_level_cm ?? 30}cm
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => setInspectedZone(zone)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Details</span>
                    </button>

                    <button
                      onClick={() => handleJumpToMapZone(zone)}
                      className="flex-1 py-2 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <MapIcon className="w-3 h-3" />
                      <span>View on Map</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW 2: FULL INTERACTIVE MAP */}
      {activeView === 'MAP' && (
        <div className="flex-1 w-full h-full min-h-0 relative">
          <DisasterMap />
        </div>
      )}

      {/* Floating Action Button for Citizen Ground Reports */}
      <div className="absolute bottom-6 right-6 z-30">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#F58220] to-[#ea6e05] hover:from-[#ea6e05] hover:to-[#DC721A] text-white rounded-2xl font-black text-xs shadow-xl shadow-[#F58220]/25 hover:shadow-2xl hover:shadow-[#F58220]/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ring-1 ring-white/30"
          title="Submit Live Ground Observation / Hazard Survey"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Report / Survey</span>
        </button>
      </div>

      {/* Ground Report Modal */}
      <CrowdReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Inspected Zone Detail Modal (from Overview or Map) */}
      {inspectedZone && (
        <ZoneDetailModal
          zone={inspectedZone}
          isOpen={!!inspectedZone}
          onClose={() => setInspectedZone(null)}
        />
      )}
    </div>
  );
};
