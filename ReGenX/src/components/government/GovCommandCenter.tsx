import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { DisasterMap } from '../map/DisasterMap';
import { OfficialUpdateModal } from './OfficialUpdateModal';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  Waves,
  Building2,
  Radio,
  CheckCircle2,
  Layers,
  Newspaper,
  Clock,
  Users,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { SEVERITY_BG_CLASSES } from '../../types';

export const GovCommandCenter: React.FC = () => {
  const {
    hazardZones,
    safePlaces,
    crowdReports,
    officialUpdates,
    newsArticles,
    setSelectedZone
  } = useDisasterData();
  const { user } = useAuth();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedWardForUpdate, setSelectedWardForUpdate] = useState<number>(57);
  const [viewMode, setViewMode] = useState<'OVERVIEW' | 'TACTICAL_MAP'>('OVERVIEW');

  // Severity Counts
  const emergencyCount = hazardZones.filter(z => z.severity === 'EMERGENCY').length;
  const highCount = hazardZones.filter(z => z.severity === 'HIGH').length;
  const moderateCount = hazardZones.filter(z => z.severity === 'MODERATE').length;
  const lowCount = hazardZones.filter(z => z.severity === 'LOW').length;
  const activeAlertsCount = emergencyCount + highCount;

  // Pending reports
  const pendingReportsCount = crowdReports.filter(r => r.verification_state === 'UNVERIFIED').length;

  // Camps capacity
  const camps = safePlaces.filter(p => p.type === 'government_camp' || p.type === 'temporary_camp');
  const totalCampBeds = camps.reduce((acc, c) => acc + (Number(c.total_capacity) || Number(c.capacity) || 0), 0);
  const occupiedCampBeds = camps.reduce((acc, c) => acc + (Number(c.occupied_capacity) || 0), 0);
  const availableCampBeds = Math.max(0, totalCampBeds - occupiedCampBeds);
  const occupancyPercentage = totalCampBeds > 0 ? Math.min(100, Math.round((occupiedCampBeds / totalCampBeds) * 100)) : 0;

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden animate-fade-in bg-[#F5F7FA] dark:bg-slate-950 transition-colors duration-200">
      {/* Top Command Subheader */}
      <div className="p-4 bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 rounded-lg border border-amber-300 dark:border-amber-500/40">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white font-heading">
              BMC Disaster Emergency Command Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time multi-hazard threat monitoring, active warnings & operational status overview
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Command Center Online</span>
          </div>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1">
            <button
              onClick={() => setViewMode('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'OVERVIEW'
                  ? 'bg-[#0B3D91] dark:bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setViewMode('TACTICAL_MAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'TACTICAL_MAP'
                  ? 'bg-[#0B3D91] dark:bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Tactical Map
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedWardForUpdate(57);
              setIsUpdateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F58220] hover:bg-[#DC721A] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Field Update</span>
          </button>
        </div>
      </div>

      {viewMode === 'TACTICAL_MAP' ? (
        <div className="flex-1 w-full h-full relative">
          <DisasterMap />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Severity Matrix KPI Banner (Section 19) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-200 dark:border-rose-500/30 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase">Emergency Wards</span>
                <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              </div>
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{emergencyCount}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Direct rescue & evacuation underway</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-orange-200 dark:border-orange-500/30 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 uppercase">High Risk Zones</span>
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-3xl font-black text-orange-600 dark:text-orange-400">{highCount}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Dewatering & barrier deployment</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-500/30 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">Moderate Wards</span>
                <Waves className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{moderateCount}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Precautionary alert active</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">Normal / Low Risk</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{67 - emergencyCount - highCount - moderateCount}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">All 67 BMC Wards monitored</p>
            </div>
          </div>

          {/* Operational Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Citizen Reports Triage Status */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Citizen Ground Submissions</span>
                  <Radio className="w-4 h-4 text-[#F58220]" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading">{crowdReports.length} Reports</h3>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
                  ⚠️ {pendingReportsCount} pending verification
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Verified: {crowdReports.filter(r => r.verification_state === 'VERIFIED').length}</span>
                <span>Disputed: {crowdReports.filter(r => r.verification_state === 'DISPUTED').length}</span>
              </div>
            </div>

            {/* Relief Camps Capacity Status */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Emergency Camps & Shelters</span>
                  <Building2 className="w-4 h-4 text-[#0B3D91] dark:text-sky-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading">{occupiedCampBeds} / {totalCampBeds} Beds</h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                  {totalCampBeds - occupiedCampBeds} beds currently available
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Active Camps: {camps.length}</span>
                <span>Occupancy: {Math.round((occupiedCampBeds / (totalCampBeds || 1)) * 100)}%</span>
              </div>
            </div>

            {/* Risk Engine Scheduler Status */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Scheduled Analytical Engine</span>
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading">20-Min Cron</h3>

              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Evaluated: 67 Wards</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">● Engine Healthy</span>
              </div>
            </div>
          </div>

          {/* Active Hazard Zones Table & Direct Mitigation Triggers */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
                Active Hazard Zones Under Watch ({hazardZones.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">Source: risk_engine.py</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/60 dark:bg-slate-950/40">
                    <th className="p-3">Ward #</th>
                    <th className="p-3">Locality Name</th>
                    <th className="p-3">Hazard</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Risk Score</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Radius</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {hazardZones.map(zone => (
                    <tr key={zone.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition">
                      <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-300">#{zone.ward_id}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{zone.ward_name}</td>
                      <td className="p-3 capitalize text-slate-700 dark:text-slate-300">{zone.hazard_type.replace('_', ' ')}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${SEVERITY_BG_CLASSES[zone.severity]}`}>
                          {zone.severity}
                        </span>
                      </td>
                      <td className="p-3 font-black" style={{ color: zone.color }}>{zone.risk_score}/100</td>
                      <td className="p-3 text-cyan-700 dark:text-cyan-400 font-semibold">{zone.confidence}%</td>
                      <td className="p-3 text-amber-700 dark:text-amber-400 font-semibold">{zone.affected_radius_km} km</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedWardForUpdate(zone.ward_id);
                            setIsUpdateModalOpen(true);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-[#0B3D91] hover:text-white text-[#0B3D91] dark:bg-slate-800 dark:hover:bg-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition shadow-xs"
                        >
                          Post Mitigation
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Official Mitigation Update Modal */}
      <OfficialUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        defaultWardId={selectedWardForUpdate}
      />
    </div>
  );
};
