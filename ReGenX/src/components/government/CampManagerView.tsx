import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { BMC_WARDS } from '../../data/bmcWards';
import { 
  Building2, 
  Plus, 
  Users, 
  Bed, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Sliders
} from 'lucide-react';

export const CampManagerView: React.FC = () => {
  const { safePlaces, createGovernmentCamp, updateCampCapacity } = useDisasterData();
  const { user } = useAuth();

  const [isCreatingCamp, setIsCreatingCamp] = useState(false);
  const [campName, setCampName] = useState('');
  const [selectedWardId, setSelectedWardId] = useState(57);
  const [address, setAddress] = useState('');
  const [totalCapacity, setTotalCapacity] = useState(250);
  const [contactPhone, setContactPhone] = useState('+919437099999');

  const camps = safePlaces.filter(p => p.type === 'government_camp' || p.type === 'temporary_camp');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ward = BMC_WARDS.find(w => w.ward_id === selectedWardId);

    await createGovernmentCamp({
      name: campName,
      ward_id: selectedWardId,
      address: address || `${ward?.ward_name}, Ward #${selectedWardId}`,
      latitude: ward?.centroid_lat || 20.2961,
      longitude: ward?.centroid_lng || 85.8245,
      total_capacity: totalCapacity,
      contact_phone: contactPhone,
      managed_by: user?.name || 'BMC Emergency Response Officer'
    });


    setIsCreatingCamp(false);
    setCampName('');
    setAddress('');
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6 animate-fade-in transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0B3D91] rounded-xl text-white">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-heading">
              Emergency Relief Camp & Shelter Allocator
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Establish temporary relief shelters, allocate bed quotas, and manage live occupancy.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCamp(!isCreatingCamp)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#F58220] hover:bg-[#DC721A] text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Establish New Relief Camp</span>
        </button>
      </div>

      {/* Establishment Form */}
      {isCreatingCamp && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 text-xs animate-fade-in">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-heading uppercase tracking-wider">
            Camp Commissioning Setup
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Camp / Shelter Facility Name</label>
              <input
                type="text"
                required
                placeholder="e.g. BMC High School Emergency Shelter"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Assigned Ward Location</label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
              >
                {BMC_WARDS.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>
                    Ward #{w.ward_id}: {w.ward_name} ({w.zone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bed Quota (Total Capacity)</label>
              <input
                type="number"
                min="20"
                max="5000"
                required
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3D91]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Emergency On-Duty Phone</label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#0B3D91]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsCreatingCamp(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl font-bold transition shadow-xs"
            >
              Deploy & Publish Camp
            </button>
          </div>
        </form>
      )}

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Active Relief Shelters</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading mt-1">{camps.length}</h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified Government Facilities</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total Capacity</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading mt-1">
            {camps.reduce((acc, c) => acc + (Number(c.total_capacity) || Number(c.capacity) || 0), 0)} Beds
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Allocated Quota Across Wards</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Occupied Beds</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading mt-1">
            {camps.reduce((acc, c) => acc + (Number(c.occupied_capacity) || 0), 0)} Beds
          </h3>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Currently Housed Citizens</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Available Buffer</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white font-heading mt-1">
            {Math.max(0, camps.reduce((acc, c) => acc + (Number(c.total_capacity) || Number(c.capacity) || 0), 0) - camps.reduce((acc, c) => acc + (Number(c.occupied_capacity) || 0), 0))} Beds
          </h3>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Ready for Emergency Evacuees</span>
        </div>
      </div>

      {/* Active Camps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {camps.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400">
            No active emergency relief camps registered. Click "Establish New Relief Camp" above to commission one.
          </div>
        ) : (
          camps.map(camp => {
            const totalBeds = Number(camp.total_capacity) || Number(camp.capacity) || 0;
            const occupiedBeds = Number(camp.occupied_capacity) || 0;
            const availableBeds = typeof camp.available_beds === 'number' ? camp.available_beds : Math.max(0, totalBeds - occupiedBeds);
            const pct = totalBeds > 0 ? Math.min(100, Math.round((occupiedBeds / totalBeds) * 100)) : 0;

            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0B3D91] dark:bg-sky-500/20 dark:text-sky-300 uppercase">
                      Ward #{camp.ward_id || 1} Camp
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading mt-1">{camp.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 uppercase">
                    {camp.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Current Occupancy:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{occupiedBeds} / {totalBeds} Beds</strong>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#0B3D91] dark:bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{availableBeds} beds remaining</span>
                    <span className="text-slate-400 dark:text-slate-500 font-mono">{pct}%</span>
                  </div>
                </div>

                {/* Adjust Bed Count Quick Stepper */}
                <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Quick Adjust:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCampCapacity(camp.id, Math.max(0, occupiedBeds - 10))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-mono font-bold cursor-pointer"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => updateCampCapacity(camp.id, Math.min(totalBeds, occupiedBeds + 10))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-mono font-bold cursor-pointer"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
