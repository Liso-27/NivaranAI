import React, { useState } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { SafePlace, SafePlaceType } from '../../types';
import { 
  Building2, 
  Search, 
  Navigation, 
  Phone, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  Users,
  Bed,
  MapPin
} from 'lucide-react';

export const SafePlaceFinder: React.FC = () => {
  const { safePlaces, userLocation } = useDisasterData();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPlaces = safePlaces.filter(place => {
    const matchesType = filterType === 'ALL' || place.type === filterType;
    const matchesSearch = 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getCapacityColor = (occupied: number, total: number) => {
    const ratio = occupied / (total || 1);
    if (ratio >= 0.9) return 'text-rose-700 dark:text-rose-400';
    if (ratio >= 0.6) return 'text-amber-700 dark:text-amber-400';
    return 'text-emerald-700 dark:text-emerald-400';
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 animate-fade-in transition-colors duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#0B3D91] dark:bg-emerald-500/20 text-white dark:text-emerald-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-heading">
              Safe Places & Evacuation Shelters
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified emergency locations with live bed capacity and automatic hazard-zone exclusion.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search hospitals, cyclone shelters, camps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0B3D91] dark:focus:border-emerald-500 shadow-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Safe Facilities' },
          { id: 'hospital', label: 'Hospitals & Trauma Centers' },
          { id: 'cyclone_shelter', label: 'Cyclone Shelters' },
          { id: 'government_camp', label: 'Government Relief Camps' },
          { id: 'fire_station', label: 'Fire & Rescue Stations' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap border ${
              filterType === tab.id
                ? 'bg-[#0B3D91] text-white border-[#0B3D91] dark:bg-emerald-600 dark:border-emerald-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlaces.map(place => {
          const tot = Number(place.total_capacity) || Number(place.capacity) || 0;
          const occ = Number(place.occupied_capacity) || 0;
          const availableBeds = typeof place.available_beds === 'number' ? place.available_beds : Math.max(0, tot - occ);
          const isFull = availableBeds <= 0;

          return (
            <div
              key={place.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
                place.is_excluded_from_routing 
                  ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50/40 dark:bg-rose-950/20' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Type & Exclusion Badge */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                    {(place.type || 'Facility').replace('_', ' ')}
                  </span>

                  {place.is_excluded_from_routing ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Inactive (Hazard Zone)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                      ✓ Safe Route Verified
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">{place.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{place.address}</span>
                  </p>
                </div>

                {/* Live Capacity Indicators */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Available Beds</span>
                    <strong className={`text-base font-black ${getCapacityColor(occ, tot)}`}>
                      {isFull ? '0 (Full)' : availableBeds}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Total Capacity</span>
                    <strong className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                      {tot} Beds
                    </strong>
                  </div>
                </div>

                {/* Contact & Ward ID */}
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pt-1">
                  <span>Ward #{place.ward_id}</span>
                  <a href={`tel:${place.contact_phone}`} className="text-[#0B3D91] dark:text-cyan-400 font-mono hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{place.contact_phone}</span>
                  </a>
                </div>
              </div>

              {/* Navigation Action */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {place.distance_km} km away
                </span>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#0B3D91] hover:bg-[#0A2F70] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-98 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>

  );
};
