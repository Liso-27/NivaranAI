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
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-[#F4F5F7] dark:bg-slate-950 transition-colors duration-200">
      {/* Top Command Subheader */}
      <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border-b border-[#D1D5DB] dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#D97706]/10 text-[#D97706] rounded-md border border-[#D97706]/30">
              <ShieldAlert className="w-4 h-4 text-[#D97706]" />
            </span>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
              BMC Disaster Emergency Command Center
            </h2>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 font-medium">
            Real-time multi-hazard threat monitoring, active warnings & operational status overview
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#059669]/10 text-[#059669] border border-[#059669]/30 rounded-md font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>Command Center Online</span>
          </div>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[#F8F9FA] dark:bg-slate-950 rounded-md border border-[#D1D5DB] dark:border-slate-800 flex gap-1">
            <button
              onClick={() => setViewMode('OVERVIEW')}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${viewMode === 'OVERVIEW'
                  ? 'bg-[#0F172A] text-white'
                  : 'text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setViewMode('TACTICAL_MAP')}
              className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${viewMode === 'TACTICAL_MAP'
                  ? 'bg-[#0F172A] text-white'
                  : 'text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md text-xs font-semibold transition cursor-pointer"
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
          {/* Severity Matrix KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#DC2626]/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#DC2626] dark:text-rose-400 uppercase">Emergency Wards</span>
                <Flame className="w-4 h-4 text-[#DC2626]" />
              </div>
              <span className="text-2xl font-bold text-[#DC2626]">{emergencyCount}</span>
              <p className="text-[10px] text-[#475569] dark:text-slate-400 mt-1 font-medium">Direct rescue & evacuation underway</p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#EA580C]/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#EA580C] dark:text-orange-400 uppercase">High Risk Zones</span>
                <AlertTriangle className="w-4 h-4 text-[#EA580C]" />
              </div>
              <span className="text-2xl font-bold text-[#EA580C]">{highCount}</span>
              <p className="text-[10px] text-[#475569] dark:text-slate-400 mt-1 font-medium">Dewatering & barrier deployment</p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D97706]/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#D97706] dark:text-amber-400 uppercase">Moderate Wards</span>
                <Waves className="w-4 h-4 text-[#D97706]" />
              </div>
              <span className="text-2xl font-bold text-[#D97706]">{moderateCount}</span>
              <p className="text-[10px] text-[#475569] dark:text-slate-400 mt-1 font-medium">Precautionary alert active</p>
            </div>

            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#059669]/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#059669] dark:text-emerald-400 uppercase">Normal / Low Risk</span>
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
              <span className="text-2xl font-bold text-[#059669]">{67 - emergencyCount - highCount - moderateCount}</span>
              <p className="text-[10px] text-[#475569] dark:text-slate-400 mt-1 font-medium">All 67 BMC Wards monitored</p>
            </div>
          </div>

          {/* Operational Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Citizen Reports Triage Status */}
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">Citizen Ground Submissions</span>
                  <Radio className="w-4 h-4 text-[#D97706]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{crowdReports.length} Reports</h3>
                <p className="text-xs text-[#D97706] font-semibold mt-1">
                  ⚠️ {pendingReportsCount} pending verification
                </p>
              </div>
              <div className="pt-3 border-t border-[#D1D5DB] dark:border-slate-800 text-xs text-[#475569] dark:text-slate-400 flex justify-between font-medium">
                <span>Verified: {crowdReports.filter(r => r.verification_state === 'VERIFIED').length}</span>
                <span>Disputed: {crowdReports.filter(r => r.verification_state === 'DISPUTED').length}</span>
              </div>
            </div>

            {/* Relief Camps Capacity Status */}
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">Emergency Camps & Shelters</span>
                  <Building2 className="w-4 h-4 text-[#059669]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{occupiedCampBeds} / {totalCampBeds} Beds</h3>
                <p className="text-xs text-[#059669] font-semibold mt-1">
                  {totalCampBeds - occupiedCampBeds} beds currently available
                </p>
              </div>
              <div className="pt-3 border-t border-[#D1D5DB] dark:border-slate-800 text-xs text-[#475569] dark:text-slate-400 flex justify-between font-medium">
                <span>Active Camps: {camps.length}</span>
                <span>Occupancy: {Math.round((occupiedCampBeds / (totalCampBeds || 1)) * 100)}%</span>
              </div>
            </div>

            {/* Risk Engine Scheduler Status */}
            <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">Scheduled Analytical Engine</span>
                  <Clock className="w-4 h-4 text-[#059669]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">20-Min Cron</h3>
              </div>
              <div className="pt-3 border-t border-[#D1D5DB] dark:border-slate-800 text-xs text-[#475569] dark:text-slate-400 flex justify-between font-medium">
                <span>Evaluated: 67 Wards</span>
                <span className="text-[#059669] font-semibold">● Engine Healthy</span>
              </div>
            </div>
          </div>

          {/* Active Hazard Zones Table & Direct Mitigation Triggers */}
          <div className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
                Active Hazard Zones Under Watch ({hazardZones.length})
              </h3>
              <span className="text-xs text-[#475569] dark:text-slate-400 font-medium">Source: risk_engine.py</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D1D5DB] dark:border-slate-800 text-[#475569] dark:text-slate-400 font-semibold bg-[#F8F9FA] dark:bg-slate-950">
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
                <tbody className="divide-y divide-[#D1D5DB]/60 dark:divide-slate-800/80">
                  {hazardZones.map(zone => (
                    <tr key={zone.id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-[#0F172A] dark:text-slate-200">#{zone.ward_id}</td>
                      <td className="p-3 font-bold text-[#0F172A] dark:text-white">{zone.ward_name}</td>
                      <td className="p-3 capitalize text-[#475569] dark:text-slate-300">{(zone.hazard_type || 'HAZARD').replace('_', ' ')}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${SEVERITY_BG_CLASSES[zone.severity]}`}>
                          {zone.severity}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#0F172A] dark:text-white">{zone.risk_score}/100</td>
                      <td className="p-3 text-[#059669] font-semibold">{zone.confidence}%</td>
                      <td className="p-3 text-[#D97706] font-semibold">{zone.affected_radius_km} km</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedWardForUpdate(zone.ward_id);
                            setIsUpdateModalOpen(true);
                          }}
                          className="px-3 py-1 bg-[#F8F9FA] hover:bg-[#E2E8F0] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 border border-[#D1D5DB] dark:border-slate-700 rounded-md text-[11px] font-semibold transition cursor-pointer"
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
