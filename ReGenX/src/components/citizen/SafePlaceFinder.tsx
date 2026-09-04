import React, { useState, useMemo } from 'react';
import { useDisasterData } from '../../context/DisasterDataContext';
import { SafePlace } from '../../types';
import { 
  Building2, 
  Search, 
  Navigation, 
  Phone, 
  AlertTriangle, 
  MapPin,
  ShieldCheck,
  Flame,
  Radio
} from 'lucide-react';

/**
 * Calculates Haversine geographic distance between two lat/lng coordinates in km.
 */
const calculateHaversineDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // WGS-84 Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export const SafePlaceFinder: React.FC = () => {
  const { safePlaces, userLocation } = useDisasterData();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Process places with location-aware distance calculation & nearest-first sorting
  const processedPlaces = useMemo(() => {
    return safePlaces.map(place => {
      let distance_km = place.distance_km;

      // Calculate real distance dynamically if user GPS coordinates are available
      if (
        (distance_km === undefined || distance_km === null) &&
        userLocation.latitude &&
        userLocation.longitude &&
        place.latitude &&
        place.longitude
      ) {
        distance_km = calculateHaversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          place.latitude,
          place.longitude
        );
      }

      const tot = Number(place.total_capacity) || Number(place.capacity) || 0;
      const avail = typeof place.available_beds === 'number' 
        ? place.available_beds 
        : (typeof place.available_capacity === 'number' ? place.available_capacity : Math.max(0, tot - (place.occupied_capacity || 0)));
      const occ = Number(place.occupied_capacity) || Math.max(0, tot - avail);

      const percentAvail = tot > 0 ? Math.round((avail / tot) * 100) : 0;

      // Determine operational availability status (>50% -> Open, 20-50% -> Filling Up, <20% -> Near Full)
      let availabilityStatus: 'OPEN' | 'FILLING_UP' | 'NEAR_FULL' | 'FULL' | 'INACTIVE' = 'OPEN';
      if (place.is_excluded_from_routing || place.is_hazard_excluded || place.status === 'CLOSED') {
        availabilityStatus = 'INACTIVE';
      } else if (avail <= 0 || place.status === 'FULL') {
        availabilityStatus = 'FULL';
      } else if (percentAvail < 20) {
        availabilityStatus = 'NEAR_FULL';
      } else if (percentAvail <= 50) {
        availabilityStatus = 'FILLING_UP';
      } else {
        availabilityStatus = 'OPEN';
      }

      return {
        ...place,
        computedDistanceKm: distance_km,
        totalCap: tot,
        availCap: avail,
        occupiedCap: occ,
        percentAvail,
        availabilityStatus
      };
    });
  }, [safePlaces, userLocation.latitude, userLocation.longitude]);

  // 2. Filter places by category and search term
  const filteredPlaces = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();

    const filtered = processedPlaces.filter(place => {
      const pType = (place.type || '').toLowerCase();
      let matchesType = filterType === 'ALL';

      if (filterType === 'hospital') {
        matchesType = pType === 'hospital';
      } else if (filterType === 'cyclone_shelter') {
        matchesType = pType === 'cyclone_shelter' || pType === 'official_shelter';
      } else if (filterType === 'government_camp') {
        matchesType = pType === 'government_camp' || pType === 'temporary_camp' || pType === 'relief_centre';
      } else if (filterType === 'fire_station') {
        matchesType = pType === 'fire_station' || pType === 'police_station';
      }

      const matchesSearch = 
        !search ||
        place.name.toLowerCase().includes(search) ||
        place.address.toLowerCase().includes(search) ||
        (place.ward_name && place.ward_name.toLowerCase().includes(search)) ||
        (place.ward_id && String(place.ward_id).includes(search));

      return matchesType && matchesSearch;
    });

    // 3. Location-aware default ordering: NEAREST FACILITIES FIRST
    return filtered.sort((a, b) => {
      const distA = a.computedDistanceKm !== undefined ? a.computedDistanceKm : 9999;
      const distB = b.computedDistanceKm !== undefined ? b.computedDistanceKm : 9999;

      if (distA !== distB) {
        return distA - distB;
      }
      // Secondary fallback sorting: Active facilities first, then by ward
      if (a.availabilityStatus === 'INACTIVE' && b.availabilityStatus !== 'INACTIVE') return 1;
      if (a.availabilityStatus !== 'INACTIVE' && b.availabilityStatus === 'INACTIVE') return -1;
      return (a.ward_id || 0) - (b.ward_id || 0);
    });
  }, [processedPlaces, filterType, searchQuery]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6 transition-colors duration-200">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#059669] text-white rounded-lg">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] dark:text-white">
              Safe Places & Evacuation Shelters
            </h2>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
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
            className="w-full bg-[#FFFFFF] dark:bg-slate-900 border border-[#D1D5DB] dark:border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#059669]"
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
            className={`px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap border cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#059669] text-white border-[#059669]'
                : 'bg-[#FFFFFF] dark:bg-slate-900 text-[#475569] dark:text-slate-400 border-[#D1D5DB] dark:border-slate-800 hover:bg-[#F8F9FA]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlaces.length === 0 ? (
          <div className="col-span-full bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-8 border border-[#D1D5DB] dark:border-slate-800 text-center space-y-2">
            <Building2 className="w-8 h-8 text-[#475569] dark:text-slate-400 mx-auto opacity-60" />
            <h4 className="text-sm font-semibold text-[#0F172A] dark:text-white">
              No matching emergency facilities found.
            </h4>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Try adjusting your search query or category filter.
            </p>
          </div>
        ) : (
          filteredPlaces.map(place => {
            const contactPhone = place.contact_number || place.contact_phone || '1077';
            const pType = place.type || 'official_shelter';

            // Determine capacity wording label
            let capacityLabel = 'AVAILABLE CAPACITY';
            if (pType === 'hospital') {
              capacityLabel = 'AVAILABLE BEDS';
            } else if (pType === 'fire_station' || pType === 'police_station') {
              capacityLabel = 'RESCUE CAPACITY';
            }

            // Left severity indicator rail styling
            let borderRailClass = 'border-l-4 border-l-[#059669]';
            if (place.availabilityStatus === 'INACTIVE' || place.availabilityStatus === 'FULL') {
              borderRailClass = 'border-l-4 border-l-[#DC2626]';
            } else if (place.availabilityStatus === 'NEAR_FULL') {
              borderRailClass = 'border-l-4 border-l-[#EA580C]';
            } else if (place.availabilityStatus === 'FILLING_UP') {
              borderRailClass = 'border-l-4 border-l-[#D97706]';
            }

            return (
              <div
                key={place.id}
                className={`bg-[#FFFFFF] dark:bg-slate-900 rounded-lg p-4 border-y border-r border-[#D1D5DB] dark:border-slate-800 ${borderRailClass} transition-all duration-150 flex flex-col justify-between space-y-3.5 hover:border-[#059669]`}
              >
                {/* 1. FACILITY IDENTITY */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    {/* Facility Type Badge */}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F8F9FA] dark:bg-slate-800 text-[#0F172A] dark:text-slate-200 border border-[#D1D5DB] dark:border-slate-700 uppercase tracking-wider">
                      {pType === 'hospital' ? 'Hospital & Trauma Center' :
                       pType === 'cyclone_shelter' || pType === 'official_shelter' ? 'Cyclone & Evacuation Shelter' :
                       pType === 'government_camp' || pType === 'temporary_camp' || pType === 'relief_centre' ? 'Government Relief Camp' :
                       pType === 'fire_station' ? 'Fire & Rescue Station' :
                       pType === 'police_station' ? 'Police & Response Post' : 'Emergency Facility'}
                    </span>

                    {/* Operational Status Pill */}
                    {place.availabilityStatus === 'INACTIVE' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Inactive (Hazard Zone)
                      </span>
                    ) : place.availabilityStatus === 'FULL' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shrink-0">
                        Full (0 Available)
                      </span>
                    ) : place.availabilityStatus === 'NEAR_FULL' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-300 dark:border-orange-700/60 shrink-0">
                        Near Full
                      </span>
                    ) : place.availabilityStatus === 'FILLING_UP' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shrink-0">
                        Filling Up
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shrink-0 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Open
                      </span>
                    )}
                  </div>

                  {/* Facility Name & Address */}
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white leading-snug">
                      {place.name}
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-slate-400 mt-1 flex items-start gap-1 leading-normal">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{place.address}</span>
                    </p>
                  </div>
                </div>

                {/* 2. AVAILABILITY & CAPACITY */}
                <div className="bg-[#F8F9FA] dark:bg-slate-950 p-3 rounded-lg border border-[#D1D5DB] dark:border-slate-800 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-[#475569] dark:text-slate-400 uppercase tracking-wider block">
                        {capacityLabel}
                      </span>
                      <div className="text-lg font-bold text-[#0F172A] dark:text-white leading-none mt-0.5">
                        {place.availCap} <span className="text-xs text-[#475569] dark:text-slate-400 font-normal">/ {place.totalCap}</span>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                      place.percentAvail > 50
                        ? 'bg-[#059669]/10 text-[#059669] border-[#059669]/30'
                        : place.percentAvail >= 20
                        ? 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/30'
                        : 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30'
                    }`}>
                      {place.percentAvail}% Available
                    </span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        place.percentAvail > 50
                          ? 'bg-[#059669]'
                          : place.percentAvail >= 20
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, 100 - place.percentAvail))}%` }}
                    />
                  </div>
                </div>

                {/* 3. LOCATION & PROXIMITY */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#475569] dark:text-slate-400 font-semibold bg-[#F8F9FA] dark:bg-slate-800 px-2 py-0.5 rounded border border-[#D1D5DB] dark:border-slate-700">
                    Ward #{place.ward_id}
                  </span>

                  <span className="font-semibold text-[#0F172A] dark:text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                    {place.computedDistanceKm !== undefined ? (
                      <span>{place.computedDistanceKm} km away</span>
                    ) : (
                      <span className="text-slate-400">Location Required</span>
                    )}
                  </span>
                </div>

                {/* 4. ACTIONS */}
                <div className="pt-3 border-t border-[#D1D5DB] dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* Compact Call Button */}
                  <a
                    href={`tel:${contactPhone}`}
                    className="px-3 py-1.5 bg-[#F8F9FA] hover:bg-[#E2E8F0] dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 border border-[#D1D5DB] dark:border-slate-700 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title={`Call ${place.name}: ${contactPhone}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Call</span>
                  </a>

                  {/* Get Directions Button */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
