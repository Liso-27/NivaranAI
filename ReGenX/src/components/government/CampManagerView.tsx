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
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#D97706] rounded-lg text-white">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] dark:text-white">
              Emergency Relief Camp & Shelter Allocator
            </h2>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 font-medium">
            Establish temporary relief shelters, allocate bed quotas, and manage live occupancy.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCamp(!isCreatingCamp)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Establish New Relief Camp</span>
        </button>
      </div>

      {/* Establishment Form */}
      {isCreatingCamp && (
        <form onSubmit={handleCreate} className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
            Camp Commissioning Setup
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">Camp / Shelter Facility Name</label>
              <input
                type="text"
                required
                placeholder="e.g. BMC High School Emergency Shelter"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">Assigned Ward Location</label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
              >
                {BMC_WARDS.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>
                    Ward #{w.ward_id}: {w.ward_name} ({w.zone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">Bed Quota (Total Capacity)</label>
              <input
                type="number"
                min="20"
                max="5000"
                required
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">Emergency On-Duty Phone</label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#D1D5DB] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreatingCamp(false)}
              className="px-4 py-2 text-[#475569] dark:text-slate-400 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md font-semibold transition"
            >
              Deploy & Publish Camp
            </button>
          </div>
        </form>
      )}

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">Active Relief Shelters</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">{camps.length}</h3>
          <span className="text-[11px] text-[#059669] font-semibold">Verified Government Facilities</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">Total Capacity</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
            {camps.reduce((acc, c) => acc + (Number(c.total_capacity) || Number(c.capacity) || 0), 0)} Beds
          </h3>
          <span className="text-[11px] text-[#475569] dark:text-slate-400 font-medium">Allocated Quota Across Wards</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">Occupied Beds</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
            {camps.reduce((acc, c) => acc + (Number(c.occupied_capacity) || 0), 0)} Beds
          </h3>
          <span className="text-[11px] text-[#D97706] font-semibold">Currently Housed Citizens</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">Available Buffer</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
            {Math.max(0, camps.reduce((acc, c) => acc + (Number(c.total_capacity) || Number(c.capacity) || 0), 0) - camps.reduce((acc, c) => acc + (Number(c.occupied_capacity) || 0), 0))} Beds
          </h3>
          <span className="text-[11px] text-[#059669] font-semibold">Ready for Emergency Evacuees</span>
        </div>
      </div>

      {/* Active Camps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {camps.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg text-xs text-[#475569] dark:text-slate-400">
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
                className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border border-[#D1D5DB] dark:border-slate-800 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-slate-200 uppercase">
                      Ward #{camp.ward_id || 1} Camp
                    </span>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mt-1">{camp.name}</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded border border-[#059669]/30 uppercase">
                    {camp.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="bg-[#F8F9FA] dark:bg-slate-950 p-3 rounded-md border border-[#D1D5DB] dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#475569] dark:text-slate-400 font-medium">Current Occupancy:</span>
                    <strong className="text-[#0F172A] dark:text-slate-200">{occupiedBeds} / {totalBeds} Beds</strong>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#D97706] h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#059669] font-semibold">{availableBeds} beds remaining</span>
                    <span className="text-[#475569] dark:text-slate-400 font-semibold">{pct}%</span>
                  </div>
                </div>

                {/* Adjust Bed Count Quick Stepper */}
                <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#475569] dark:text-slate-400 font-medium">Quick Adjust:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCampCapacity(camp.id, Math.max(0, occupiedBeds - 10))}
                      className="px-2.5 py-1 bg-[#F8F9FA] hover:bg-[#E2E8F0] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 rounded-md font-semibold cursor-pointer border border-[#D1D5DB] dark:border-slate-700"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => updateCampCapacity(camp.id, Math.min(totalBeds, occupiedBeds + 10))}
                      className="px-2.5 py-1 bg-[#F8F9FA] hover:bg-[#E2E8F0] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 rounded-md font-semibold cursor-pointer border border-[#D1D5DB] dark:border-slate-700"
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
