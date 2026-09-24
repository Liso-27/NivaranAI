import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
  const { t, tWard, tZone, tSafePlaceStatus, tx } = useLanguage();

  const [isCreatingCamp, setIsCreatingCamp] = useState(false);
  const [campName, setCampName] = useState('');
  const [campCategory, setCampCategory] = useState<string>('government_camp');
  const [selectedWardId, setSelectedWardId] = useState(57);
  const [address, setAddress] = useState('');
  const [totalCapacity, setTotalCapacity] = useState(250);
  const [contactPhone, setContactPhone] = useState('+919437099999');

  const camps = safePlaces.filter(p => p.type === 'government_camp' || p.type === 'temporary_camp' || p.type === 'official_shelter' || p.type === 'cyclone_shelter' || p.type === 'relief_centre');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ward = BMC_WARDS.find(w => w.ward_id === selectedWardId);

    await createGovernmentCamp({
      name: campName,
      type: campCategory,
      category: campCategory,
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
    setCampCategory('government_camp');
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
              {t('campManager.title')}
            </h2>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 font-medium">
            {t('campManager.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCamp(!isCreatingCamp)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('campManager.establishNewCamp')}</span>
        </button>
      </div>

      {/* Establishment Form */}
      {isCreatingCamp && (
        <form onSubmit={handleCreate} className="bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-5 border border-[#D1D5DB] dark:border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
            {t('campManager.formTitle')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">{t('campManager.facilityName')}</label>
              <input
                type="text"
                required
                placeholder={t('campManager.facilityNamePlaceholder')}
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">Camp Facility Category</label>
              <select
                value={campCategory}
                onChange={(e) => setCampCategory(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
              >
                <option value="government_camp">Government Emergency Relief Camp</option>
                <option value="temporary_camp">Temporary Evacuation Center</option>
                <option value="cyclone_shelter">Multipurpose Cyclone / Flood Shelter</option>
                <option value="official_shelter">Official Community Evacuation Shelter</option>
                <option value="relief_centre">Medical & Relief Distribution Hub</option>
              </select>
            </div>

            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">{t('campManager.assignedWard')}</label>
              <select
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(Number(e.target.value))}
                className="w-full bg-[#FFFFFF] dark:bg-slate-950 border border-[#D1D5DB] dark:border-slate-800 rounded-md px-3 py-2 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#D97706]"
              >
                {BMC_WARDS.map(w => (
                  <option key={w.ward_id} value={w.ward_id}>
                    {t('common.ward')} #{w.ward_id}: {tWard(w.ward_id, w.ward_name)} ({tZone(w.zone)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">{t('campManager.bedQuota')}</label>
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
              <label className="block text-[#0F172A] dark:text-slate-300 font-semibold mb-1">{t('campManager.dutyPhone')}</label>
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-md font-semibold transition"
            >
              {t('campManager.deployCamp')}
            </button>
          </div>
        </form>
      )}

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">{t('campManager.activeShelters')}</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">{camps.length}</h3>
          <span className="text-[11px] text-[#059669] font-semibold">{t('campManager.verifiedGovFacilities')}</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">{t('safePlaces.totalCapacity')}</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
            {t('campManager.bedsCount', { count: camps.reduce((acc, c) => acc + (Number(c.total_capacity) || Number(c.capacity) || 0), 0) })}
          </h3>
          <span className="text-[11px] text-[#475569] dark:text-slate-400 font-medium">{t('campManager.allocatedQuota')}</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">{t('campManager.occupiedBeds')}</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
            {t('campManager.bedsCount', { count: camps.reduce((acc, c) => acc + (Number(c.occupied_capacity) || 0), 0) })}
          </h3>
          <span className="text-[11px] text-[#D97706] font-semibold">{t('campManager.housedCitizens')}</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg">
          <span className="text-xs font-semibold text-[#475569] dark:text-slate-400 uppercase">{t('campManager.availableBuffer')}</span>
          <h3 className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
            {t('campManager.bedsCount', { count: Math.max(0, camps.reduce((acc, c) => acc + (Number(c.total_capacity) || Number(c.capacity) || 0), 0) - camps.reduce((acc, c) => acc + (Number(c.occupied_capacity) || 0), 0)) })}
          </h3>
          <span className="text-[11px] text-[#059669] font-semibold">{t('campManager.readyForEvacuees')}</span>
        </div>
      </div>

      {/* Active Camps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {camps.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-lg text-xs text-[#475569] dark:text-slate-400">
            {t('campManager.noActiveCamps')}
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
                      {t('campManager.wardCampBadge', { ward: camp.ward_id || 1 })}
                    </span>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mt-1">{tx(camp.name)}</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded border border-[#059669]/30 uppercase">
                    {tSafePlaceStatus(camp.status || 'ACTIVE')}
                  </span>
                </div>

                <div className="bg-[#F8F9FA] dark:bg-slate-950 p-3 rounded-md border border-[#D1D5DB] dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#475569] dark:text-slate-400 font-medium">{t('campManager.currentOccupancy')}</span>
                    <strong className="text-[#0F172A] dark:text-slate-200">
                      {t('govCommand.bedsOccupiedRatio', { occupied: occupiedBeds, total: totalBeds })}
                    </strong>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#D97706] h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#059669] font-semibold">
                      {t('campManager.bedsRemaining', { count: availableBeds })}
                    </span>
                    <span className="text-[#475569] dark:text-slate-400 font-semibold">{pct}%</span>
                  </div>
                </div>

                {/* Adjust Bed Count Quick Stepper */}
                <div className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#475569] dark:text-slate-400 font-medium">{t('campManager.quickAdjust')}</span>
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
