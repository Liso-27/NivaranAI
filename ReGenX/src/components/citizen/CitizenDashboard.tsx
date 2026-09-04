import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { DisasterMap } from '../map/DisasterMap';
import { CrowdReportModal } from './CrowdReportModal';
import { ZoneDetailModal } from '../map/ZoneDetailModal';
import { HazardZone, SEVERITY_BG_CLASSES } from '../../types';
import { BMC_WARDS } from '../../data/bmcWards';
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
  ShieldCheck,
  Building2,
  Phone,
  ExternalLink,
  Globe
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
  const [selectedWardId, setSelectedWardId] = useState<number | 'ALL'>('ALL');
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: number; src: string; label: string; supportingText: string; alt: string; contain?: boolean } | null>(null);

  // Escape key listener for lightbox modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  // Find nearest safe place for user if in danger
  const nonExcludedSafePlaces = safePlaces.filter(p => !p.is_excluded_from_routing && !p.is_hazard_excluded);
  const nearestShelter = nonExcludedSafePlaces[0];

  // Statistics
  const emergencyZonesCount = hazardZones.filter(z => z.severity === 'EMERGENCY').length;
  const highZonesCount = hazardZones.filter(z => z.severity === 'HIGH').length;

  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'flood': return <Waves className="w-5 h-5 text-[#475569] dark:text-slate-400" />;
      case 'heavy_rainfall': return <CloudRain className="w-5 h-5 text-[#475569] dark:text-slate-400" />;
      case 'waterlogging': return <Waves className="w-5 h-5 text-[#475569] dark:text-slate-400" />;
      case 'lightning': return <Zap className="w-5 h-5 text-[#475569] dark:text-slate-400" />;
      case 'cyclone': return <Flame className="w-5 h-5 text-[#475569] dark:text-slate-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-[#475569] dark:text-slate-400" />;
    }
  };

  const handleJumpToMapZone = (zone: HazardZone) => {
    setSelectedZone(zone);
    setActiveView('MAP');
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 relative overflow-hidden bg-[#F4F5F7] dark:bg-slate-950 transition-colors duration-200">
      {/* 1. View Mode Sub-Bar (Overview vs Live Map) */}
      <div className="bg-[#FFFFFF]/95 dark:bg-slate-900/90 border-b border-[#D1D5DB] dark:border-slate-800/80 px-4 py-2 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('OVERVIEW')}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeView === 'OVERVIEW'
                ? 'bg-[#0F172A] text-white shadow-2xs'
                : 'bg-[#F8F9FA] dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-[#E2E8F0] dark:hover:bg-slate-700'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Disaster Awareness Overview</span>
          </button>

          <button
            onClick={() => setActiveView('MAP')}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              activeView === 'MAP'
                ? 'bg-[#0F172A] text-white shadow-2xs'
                : 'bg-[#F8F9FA] dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-[#E2E8F0] dark:hover:bg-slate-700'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Interactive 67-Ward Map</span>
          </button>
        </div>

        {/* GPS Quick Telemetry Tag */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          {userLocation.latitude && userLocation.longitude ? (
            <div className="flex items-center gap-1.5 text-[#059669] font-semibold bg-[#059669]/10 px-2.5 py-1 rounded-md border border-[#059669]/30">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <span>GPS Active: {userLocation.latitude.toFixed(4)}°N, {userLocation.longitude.toFixed(4)}°E</span>
            </div>
          ) : (
            <button
              onClick={() => requestUserLocation()}
              disabled={userLocation.isLoading}
              className="flex items-center gap-1.5 text-[#D97706] font-semibold bg-[#D97706]/10 px-2.5 py-1 rounded-md border border-[#D97706]/30 hover:bg-[#D97706]/20 transition cursor-pointer"
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
        <div className="bg-rose-600 text-white px-4 py-3 shadow-lg z-30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-bold tracking-wide uppercase flex items-center gap-2">
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
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition shadow-sm"
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
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Quick Status Cards with Operational Severity Rails */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-[#FFFFFF] dark:bg-slate-900 p-4 rounded-r-lg border-y border-r border-[#D1D5DB] dark:border-slate-800 border-l-4 border-l-[#DC2626] space-y-1">
              <div className="flex items-center justify-between text-[#DC2626]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400">Active Hazards</span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#0F172A] dark:text-white">
                {hazardZones.length}
              </div>
              <p className="text-[10px] text-[#DC2626] font-semibold">
                {emergencyZonesCount} Emergency • {highZonesCount} High Risk
              </p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 p-4 rounded-r-lg border-y border-r border-[#D1D5DB] dark:border-slate-800 border-l-4 border-l-[#059669] space-y-1">
              <div className="flex items-center justify-between text-[#059669]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400">BMC Ward Coverage</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#0F172A] dark:text-white">
                67 Wards
              </div>
              <p className="text-[10px] text-[#059669] font-semibold">
                100% Geo-Centroids Monitored
              </p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 p-4 rounded-r-lg border-y border-r border-[#D1D5DB] dark:border-slate-800 border-l-4 border-l-[#D97706] space-y-1">
              <div className="flex items-center justify-between text-[#D97706]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400">Citizen Reports</span>
                <Radio className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#0F172A] dark:text-white">
                {crowdReports.length}
              </div>
              <p className="text-[10px] text-[#D97706] font-semibold">
                {crowdReports.filter(r => r.verification_state === 'VERIFIED').length} Verified Observations
              </p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 p-4 rounded-r-lg border-y border-r border-[#D1D5DB] dark:border-slate-800 border-l-4 border-l-[#0F172A] dark:border-l-slate-400 space-y-1">
              <div className="flex items-center justify-between text-[#0F172A] dark:text-slate-300">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] dark:text-slate-400">Field Actions</span>
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-[#0F172A] dark:text-white">
                {officialUpdates.length}
              </div>
              <p className="text-[10px] text-[#475569] dark:text-slate-400 font-semibold">
                BMC Pumps & Response Active
              </p>
            </div>
          </div>

          {/* PREPAREDNESS & RESPONSE Photo Gallery Section */}
          <section className="space-y-3 py-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1.5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white font-heading uppercase tracking-wide">
                  PREPAREDNESS & RESPONSE
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Field response • Flood awareness • Cyclone preparedness
                </p>
              </div>
            </div>

            {/* 3 Columns x 2 Rows Photo Gallery */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 1,
                  src: '/images/preparedness/photo1_flood_rescue.jpg',
                  label: 'Flood Rescue',
                  supportingText: 'Field rescue operation',
                  alt: 'Flood rescue operation using an inflatable rescue boat'
                },
                {
                  id: 2,
                  src: '/images/preparedness/photo2_urban_waterlogging.png',
                  label: 'Urban Waterlogging',
                  supportingText: 'Flooded-road conditions',
                  alt: 'Urban road affected by heavy waterlogging'
                },
                {
                  id: 3,
                  src: '/images/preparedness/photo3_coastal_response.jpg',
                  label: 'Coastal Response',
                  supportingText: 'Pre-cyclone field assessment',
                  alt: 'Disaster response personnel assessing a coastal area'
                },
                {
                  id: 4,
                  src: '/images/preparedness/photo4_rescue_operations.png',
                  label: 'Rescue Operations',
                  supportingText: 'Emergency field response',
                  alt: 'Rescue teams conducting flood evacuation using inflatable boats'
                },
                {
                  id: 5,
                  src: '/images/preparedness/photo5_cyclone_shelter.jpg',
                  label: 'Cyclone Shelter',
                  supportingText: 'Community preparedness',
                  alt: 'Multipurpose cyclone shelter for disaster preparedness'
                },
                {
                  id: 6,
                  src: '/images/preparedness/photo6_disaster_awareness.jpg',
                  label: 'Disaster Awareness',
                  supportingText: 'Public safety guidance',
                  alt: 'Odisha disaster awareness and safety guidance poster',
                  contain: true
                }
              ].map((photo, index) => (
                <div
                  key={photo.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`View image: ${photo.label}`}
                  onClick={() => setSelectedPhoto(photo)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPhoto(photo);
                    }
                  }}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="group flex flex-col bg-[#FFFDF9] dark:bg-slate-900 rounded-md border border-[#D9D6CF] dark:border-slate-800 overflow-hidden shadow-2xs hover:border-[#8A9A86] dark:hover:border-slate-700 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8A9A86] active:scale-[0.98]"
                >
                  {/* Image Container */}
                  <div className="relative w-full h-28 sm:h-32 bg-[#F9F7F3] dark:bg-slate-950 overflow-hidden">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className={`w-full h-full ${photo.contain ? 'object-contain p-1 bg-[#F9F7F3] dark:bg-slate-950' : 'object-cover'} group-hover:scale-[1.015] transition-transform duration-300 ease-out`}
                    />
                  </div>

                  {/* Captions */}
                  <div className="p-2 space-y-0.5 border-t border-[#D9D6CF] dark:border-slate-800/80 bg-[#F9F7F3]/50 dark:bg-slate-900/50">
                    <h4 className="text-xs font-bold text-[#2F3E46] dark:text-white group-hover:text-[#8A9A86] dark:group-hover:text-emerald-400 transition-colors leading-tight">
                      {photo.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                      {photo.supportingText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Active Hazard Zones Section with Ward Filter & Operational Data Table */}
          {(() => {
            const displayedHazards = selectedWardId === 'ALL'
              ? hazardZones
              : hazardZones.filter(z => z.ward_id === selectedWardId);

            return (
              <div className="space-y-4">
                {/* Header & Ward Filter Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] dark:bg-slate-900 p-4 rounded-lg border border-[#D1D5DB] dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                      Active Hazard Zones in Bhubaneswar
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                      Data-calibrated hazard severity and affected perimeters across 67 wards.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-[#0F172A] dark:text-slate-300 shrink-0">Ward:</label>
                      <select
                        value={selectedWardId}
                        onChange={(e) => setSelectedWardId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        className="bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-[#0F172A] dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#D97706] transition cursor-pointer"
                      >
                        <option value="ALL">All Wards (67 Wards)</option>
                        {BMC_WARDS.map(w => (
                          <option key={w.ward_id} value={w.ward_id}>
                            Ward #{w.ward_id}: {w.ward_name} ({w.zone} Zone)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setActiveView('MAP')}
                      className="px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>View Full Map</span>
                    </button>
                  </div>
                </div>

                {/* Operational Data Table */}
                <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg border border-[#D1D5DB] dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#0F172A] text-slate-300 border-b border-[#1E293B] text-[11px] font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">Hazard & Ward</th>
                          <th className="py-3 px-3">Severity</th>
                          <th className="py-3 px-3">Risk Score</th>
                          <th className="py-3 px-3">Confidence</th>
                          <th className="py-3 px-3">Radius</th>
                          <th className="py-3 px-4">Telemetry / Inundation</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1D5DB]/60 dark:divide-slate-800/80">
                        {displayedHazards.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-[#475569] dark:text-slate-400 font-medium">
                              No active hazard records found for the selected ward filter.
                            </td>
                          </tr>
                        ) : (
                          displayedHazards.map(zone => (
                            <tr key={zone.id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-md bg-[#F8F9FA] dark:bg-slate-800 border border-[#D1D5DB] dark:border-slate-700 shrink-0">
                                    {getHazardIcon(zone.hazard_type)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[#0F172A] dark:text-white capitalize">
                                      {zone.hazard_type.replace('_', ' ')}
                                    </div>
                                    <div className="text-[11px] text-[#475569] dark:text-slate-400 font-medium">
                                      Ward #{zone.ward_id}: {zone.ward_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase ${SEVERITY_BG_CLASSES[zone.severity]}`}>
                                  {zone.severity}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="font-bold text-sm text-[#0F172A] dark:text-white">
                                  {zone.risk_score}/100
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-[#0F172A] dark:text-slate-300 font-bold">
                                {zone.confidence ?? 90}%
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap text-[#0F172A] dark:text-slate-300 font-medium">
                                {zone.affected_radius_km} km
                              </td>
                              <td className="py-3 px-4 text-[#475569] dark:text-slate-300 font-medium text-[11px]">
                                {zone.weather_data?.rainfall_mm ?? 45}mm rain • {zone.weather_data?.water_level_cm ?? 30}cm water
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setInspectedZone(zone)}
                                    className="px-2.5 py-1 bg-[#F8F9FA] hover:bg-[#E2E8F0] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 border border-[#D1D5DB] rounded-md font-bold text-[11px] transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                                  >
                                    Inspect
                                  </button>
                                  <button
                                    onClick={() => handleJumpToMapZone(zone)}
                                    className="px-2.5 py-1 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md font-bold text-[11px] transition flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                                  >
                                    <MapIcon className="w-3 h-3" />
                                    <span>Map</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. BMC MUNICIPAL & PUBLIC SAFETY INFORMATION FOOTER */}
                <footer className="mt-6 border-t border-[#D1D5DB] dark:border-slate-800 pt-5 pb-2 text-xs text-[#0F172A] dark:text-slate-300">
                  <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 sm:p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-4">
                    {/* Main Message & BMC Slogan */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D1D5DB] dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-[#0F172A] rounded text-[#D97706]">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <h4 className="text-base font-bold text-[#0F172A] dark:text-white tracking-tight">
                            Bhubaneswar Municipal Corporation (BMC)
                          </h4>
                        </div>
                        <p className="text-xs text-[#475569] dark:text-slate-400 font-semibold mt-0.5">
                          Prevention Today. Protection Tomorrow.
                        </p>
                      </div>

                      <a
                        href="https://www.bmc.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md font-semibold text-xs transition cursor-pointer w-fit"
                      >
                        <span>BMC Services</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Content Columns (Official Contacts, Links & Visual) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Col 1: Official Helplines & Phone Contacts */}
                      <div className="space-y-2">
                        <h5 className="font-semibold text-[11px] uppercase tracking-wider text-[#475569] dark:text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>Official Helplines & Contacts</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs">
                          <li className="flex items-center justify-between">
                            <span className="text-[#475569] dark:text-slate-400">Bhubaneswar One:</span>
                            <a href="tel:1929" className="font-semibold text-[#0F172A] dark:text-slate-200 hover:text-[#D97706] hover:underline">
                              1929 (Toll-Free)
                            </a>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-[#475569] dark:text-slate-400">BMC Head Office:</span>
                            <a href="tel:06742431403" className="font-semibold text-[#0F172A] dark:text-slate-200 hover:text-[#D97706] hover:underline">
                              0674-2431403
                            </a>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-[#475569] dark:text-slate-400">BMC Contact:</span>
                            <a href="tel:8280282000" className="font-semibold text-[#0F172A] dark:text-slate-200 hover:text-[#D97706] hover:underline">
                              8280282000
                            </a>
                          </li>
                          <li className="flex items-center justify-between pt-1 border-t border-[#D1D5DB]/60 dark:border-slate-800">
                            <span className="text-[#475569] dark:text-slate-400">Official Email:</span>
                            <a href="mailto:info@bmc.gov.in" className="font-semibold text-[#0F172A] dark:text-slate-200 hover:text-[#D97706] hover:underline">
                              info@bmc.gov.in
                            </a>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="text-[#475569] dark:text-slate-400">Grievance Portal:</span>
                            <a href="mailto:grievance@bmc.gov.in" className="font-semibold text-[#0F172A] dark:text-slate-200 hover:text-[#D97706] hover:underline">
                              grievance@bmc.gov.in
                            </a>
                          </li>
                        </ul>
                      </div>

                      {/* Col 2: Official Web Portals & Links */}
                      <div className="space-y-2">
                        <h5 className="font-bold text-[11px] uppercase tracking-wider text-[#475569] dark:text-slate-400 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#059669]" />
                          <span>Official Links</span>
                        </h5>
                        <ul className="space-y-2 text-xs font-medium">
                          <li>
                            <a
                              href="https://www.bmc.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between font-bold text-[#0F172A] dark:text-slate-200 hover:text-[#059669] group"
                            >
                              <span>BMC Official Website</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#059669]" />
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://www.bmc.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between text-[#475569] dark:text-slate-300 hover:text-[#059669] group"
                            >
                              <span>BMC Citizen Services</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#059669]" />
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://www.bmc.gov.in/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between text-[#475569] dark:text-slate-300 hover:text-[#059669] group"
                            >
                              <span>BMC Grievance / Complaint</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#059669]" />
                            </a>
                          </li>
                        </ul>
                      </div>

                      {/* Col 3: Visual & Municipal Context */}
                      <div className="flex flex-col justify-between space-y-2 border-t md:border-t-0 md:border-l border-[#D1D5DB] dark:border-slate-800 md:pl-5 pt-3 md:pt-0">
                        <div className="relative rounded-md overflow-hidden border border-[#D1D5DB] dark:border-slate-800 h-24 bg-slate-900 group">
                          <img
                            src="/images/preparedness/photo6_disaster_awareness.jpg"
                            alt="Bhubaneswar Municipal Public Safety Awareness"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 to-transparent flex items-end p-2">
                            <span className="text-[10px] font-bold text-white tracking-wide">
                              Bhubaneswar Civic Safety & Preparedness
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#475569] dark:text-slate-400 leading-normal">
                          Official municipal public safety information provided in collaboration with BMC & Odisha State Disaster Management Authority (OSDMA).
                        </p>
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            );
          })()}
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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg font-semibold text-xs transition cursor-pointer shadow-md"
          title="Submit Live Ground Observation / Hazard Survey"
        >
          <Plus className="w-4 h-4" />
          <span>Report Hazard / Observation</span>
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

      {/* Photo Lightbox Modal for PREPAREDNESS & RESPONSE */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.label}
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 max-w-2xl w-full overflow-hidden shadow-2xl space-y-0"
          >
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading">
                  {selectedPhoto.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedPhoto.supportingText}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                aria-label="Close image lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                className="max-h-[68vh] max-w-full object-contain rounded"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 font-medium">
              {selectedPhoto.alt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
