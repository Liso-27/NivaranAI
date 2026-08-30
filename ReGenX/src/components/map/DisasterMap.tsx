import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useDisasterData } from '../../context/DisasterDataContext';
import { HazardZone } from '../../types';
import { BHUBANESWAR_CENTER, BMC_WARDS } from '../../data/bmcWards';
import { 
  Layers, 
  Crosshair, 
  Search, 
  Info,
  X,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ZonePreviewCard } from './ZonePreviewCard';
import { ZoneDetailModal } from './ZoneDetailModal';
import { renderHazardZonesLayer } from './layers/hazardZonesLayer';
import { renderSafePlacesLayer } from './layers/safePlacesLayer';
import { renderGovernmentCampsLayer } from './layers/governmentCampsLayer';
import { renderCrowdReportsLayer } from './layers/crowdReportsLayer';
import { renderOfficialUpdatesLayer } from './layers/officialUpdatesLayer';
import { renderUserLocationLayer } from './layers/userLocationLayer';

export const DisasterMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    hazards: L.LayerGroup;
    safePlaces: L.LayerGroup;
    governmentCamps: L.LayerGroup;
    crowdReports: L.LayerGroup;
    officialUpdates: L.LayerGroup;
    userLocation: L.LayerGroup;
  } | null>(null);

  const { 
    hazardZones, 
    safePlaces, 
    crowdReports, 
    officialUpdates, 
    layerState, 
    toggleLayer, 
    setSeverityFilter,
    userLocation,
    requestUserLocation,
    selectedZone,
    setSelectedZone
  } = useDisasterData();

  const [previewZone, setPreviewZone] = useState<HazardZone | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [shouldFlyToUser, setShouldFlyToUser] = useState<boolean>(false);
  const [isMapCenteredOnUser, setIsMapCenteredOnUser] = useState<boolean>(true);

  // Handle Hazard Zone Selection
  const handleZoneSelect = useCallback((zone: HazardZone) => {
    setPreviewZone(zone);
    setSelectedZone(zone);
  }, [setSelectedZone]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [BHUBANESWAR_CENTER.lat, BHUBANESWAR_CENTER.lng],
      zoom: BHUBANESWAR_CENTER.defaultZoom,
      zoomControl: false,
      attributionControl: false
    });

    // OpenStreetMap Raster Tiles (Clean, free, high contrast)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Zoom Controls in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initialize Dedicated Layer Groups
    const hazards = L.layerGroup().addTo(map);
    const safePlacesGroup = L.layerGroup().addTo(map);
    const governmentCampsGroup = L.layerGroup().addTo(map);
    const crowdReportsGroup = L.layerGroup().addTo(map);
    const officialUpdatesGroup = L.layerGroup().addTo(map);
    const userLocationGroup = L.layerGroup().addTo(map);

    layerGroupsRef.current = {
      hazards,
      safePlaces: safePlacesGroup,
      governmentCamps: governmentCampsGroup,
      crowdReports: crowdReportsGroup,
      officialUpdates: officialUpdatesGroup,
      userLocation: userLocationGroup
    };

    mapInstanceRef.current = map;

    const handleDragStart = () => setIsMapCenteredOnUser(false);
    map.on('dragstart', handleDragStart);

    // Resize Observer for dynamic viewport responsiveness
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.off('dragstart', handleDragStart);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Hazard Zones Layer (Affected Radius & Severity Badges)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderHazardZonesLayer(
      layerGroupsRef.current.hazards,
      hazardZones,
      layerState,
      handleZoneSelect
    );
  }, [hazardZones, layerState, handleZoneSelect]);

  // 3. Render Safe Places Layer (Hospitals & Shelters)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderSafePlacesLayer(
      layerGroupsRef.current.safePlaces,
      safePlaces,
      layerState.showSafePlaces
    );
  }, [safePlaces, layerState.showSafePlaces]);

  // 4. Render Government Relief Camps Layer
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderGovernmentCampsLayer(
      layerGroupsRef.current.governmentCamps,
      safePlaces,
      layerState.showGovernmentCamps
    );
  }, [safePlaces, layerState.showGovernmentCamps]);

  // 5. Render Crowd Reports Layer (Observations & Verification Status)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderCrowdReportsLayer(
      layerGroupsRef.current.crowdReports,
      crowdReports,
      layerState.showCrowdReports
    );
  }, [crowdReports, layerState.showCrowdReports]);

  // 6. Render Official Field Updates Layer (BMC Mitigation Interventions)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderOfficialUpdatesLayer(
      layerGroupsRef.current.officialUpdates,
      officialUpdates,
      layerState.showOfficialUpdates
    );
  }, [officialUpdates, layerState.showOfficialUpdates]);

  // 7. Render User Current Location Marker & Accuracy Radius
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderUserLocationLayer(
      layerGroupsRef.current.userLocation,
      userLocation
    );
  }, [userLocation]);

  // Center on searched ward
  const handleSearchWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    const matchedWard = BMC_WARDS.find(w => 
      w.ward_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.ward_id.toString() === searchQuery.trim()
    );

    if (matchedWard) {
      mapInstanceRef.current.flyTo([matchedWard.centroid_lat, matchedWard.centroid_lng], 14, { duration: 1.2 });
      const matchedZone = hazardZones.find(z => z.ward_id === matchedWard.ward_id);
      if (matchedZone) {
        setPreviewZone(matchedZone);
        setSelectedZone(matchedZone);
      }
    }
  };

  // Center view on user device location
  const centerOnUser = () => {
    setShouldFlyToUser(true);
    requestUserLocation();
  };

  // When location is updated, and shouldFlyToUser is true, move the map
  useEffect(() => {
    if (shouldFlyToUser && userLocation.latitude && userLocation.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.latitude, userLocation.longitude], 15, { duration: 1.2 });
      setShouldFlyToUser(false);
      setIsMapCenteredOnUser(true);
    }
  }, [userLocation.latitude, userLocation.longitude, shouldFlyToUser]);

  return (
    <div className="relative w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F5F7FA] dark:bg-slate-950">
      {/* Map Search & Control Overlays */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 max-w-sm w-full">
        <form onSubmit={handleSearchWard} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search 67 Wards (e.g. Kalinga Nagar, Baramunda)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] dark:focus:border-rose-500 shadow-lg transition-all"
          />
        </form>

        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`p-2.5 rounded-2xl border backdrop-blur-md transition-all duration-150 shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${
            showLayerPanel 
              ? 'bg-[#0B3D91] text-white border-[#0B3D91] dark:bg-rose-600 dark:border-rose-500' 
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Toggle Layers & Filters"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={centerOnUser}
          disabled={userLocation.isLoading}
          className={`p-2.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 border rounded-2xl backdrop-blur-md transition-all duration-150 shadow-lg hover:scale-105 active:scale-95 cursor-pointer ${
            userLocation.permissionGranted
              ? 'text-blue-600 dark:text-cyan-400 border-blue-200 dark:border-cyan-500/40'
              : userLocation.permissionStatus === 'denied'
              ? 'text-rose-500 border-rose-200 dark:border-rose-800/60'
              : 'text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700'
          }`}
          title={
            userLocation.isLoading 
              ? 'Acquiring GPS location...' 
              : userLocation.permissionGranted 
              ? 'Center on My GPS Location' 
              : userLocation.permissionStatus === 'denied'
              ? 'Location Permission Denied'
              : 'Locate My Position'
          }
        >
          {userLocation.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#0B3D91] dark:text-cyan-400" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Geolocation Notice Banner */}
      {userLocation.error && (
        <div className="absolute top-16 left-3 right-3 md:right-auto md:max-w-md z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-rose-200 dark:border-rose-800/80 rounded-2xl p-3 shadow-xl animate-fade-in flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold">Device Geolocation Notice</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{userLocation.error}</p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => requestUserLocation()}
                className="text-[11px] font-bold text-[#0B3D91] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry Location Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layer Toggles & Filter Panel Popover */}
      {showLayerPanel && (
        <div className="absolute top-14 left-3 z-30 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-2xl animate-fade-in text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-slate-900 dark:text-white font-heading">Map Layers</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">BMC Live Data</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                Hazard Zones
              </span>
              <input
                type="checkbox"
                checked={layerState.showHazardZones}
                onChange={() => toggleLayer('showHazardZones')}
                className="accent-rose-500"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Safe Places (Hospitals, Shelters)
              </span>
              <input
                type="checkbox"
                checked={layerState.showSafePlaces}
                onChange={() => toggleLayer('showSafePlaces')}
                className="accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                Government Relief Camps
              </span>
              <input
                type="checkbox"
                checked={layerState.showGovernmentCamps}
                onChange={() => toggleLayer('showGovernmentCamps')}
                className="accent-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Crowd Observations
              </span>
              <input
                type="checkbox"
                checked={layerState.showCrowdReports}
                onChange={() => toggleLayer('showCrowdReports')}
                className="accent-amber-500"
              />
            </label>

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Official Field Updates
              </span>
              <input
                type="checkbox"
                checked={layerState.showOfficialUpdates}
                onChange={() => toggleLayer('showOfficialUpdates')}
                className="accent-blue-500"
              />
            </label>
          </div>

          {/* Severity Filter */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 text-[11px]">Filter by Severity:</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {(['ALL', 'LOW', 'MODERATE', 'HIGH', 'EMERGENCY'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`py-1 px-2 rounded-lg font-bold border transition duration-150 ${
                    layerState.selectedSeverityFilter === sev
                      ? 'bg-[#0B3D91] text-white border-[#0B3D91] dark:bg-rose-600 dark:border-rose-500 shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Recenter Control */}
      {!isMapCenteredOnUser && userLocation.latitude && userLocation.longitude && (
        <button
          onClick={centerOnUser}
          className="absolute bottom-24 right-4 z-30 p-3 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0B3D91] dark:text-cyan-400 border border-slate-200/90 dark:border-slate-700 rounded-full backdrop-blur-md shadow-xl transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer animate-fade-in"
          title="Recenter Map to My Location"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      )}

      {/* Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 min-h-0 z-10" />

      {/* Floating Interactive Map Legend (Collapsible) */}
      <div className="absolute bottom-5 left-3 z-30 flex flex-col items-start gap-1.5 pointer-events-auto">
        {showLegend && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-700/80 shadow-2xl animate-fade-in text-[11px] space-y-2.5 max-w-xs w-64 mb-1 transition-all">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span className="font-black text-slate-900 dark:text-white font-heading uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0B3D91] dark:text-[#F58220]" />
                Map Legend & Severity
              </span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hazard Severity Levels */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">Hazard Severity</span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-black text-rose-800 dark:text-rose-300">EMERGENCY</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                  <span className="font-bold text-orange-800 dark:text-orange-300">HIGH</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-bold text-amber-800 dark:text-amber-300">MODERATE</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">LOW</span>
                </div>
              </div>
            </div>

            {/* Marker Symbols */}
            <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">Marker Symbols</span>
              <div className="space-y-1 text-[10px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">H</span>
                  <span>Hospitals & Safe Centers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">C</span>
                  <span>Relief & Evacuation Camps</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-bold shrink-0">📢</span>
                  <span>Citizen Crowd Observations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">⚡</span>
                  <span>Official Field Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 animate-pulse">📍</span>
                  <span>Your GPS Location</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`px-3 py-1.5 rounded-xl border backdrop-blur-md font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer ${
            showLegend
              ? 'bg-[#0B3D91] text-white border-[#0B3D91] dark:bg-rose-600 dark:border-rose-500'
              : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showLegend ? 'Hide Legend' : 'Map Legend'}</span>
        </button>
      </div>

      {/* Interactive Bottom Overlay: Zone Preview Card */}
      {previewZone && (
        <ZonePreviewCard
          zone={previewZone}
          onClose={() => setPreviewZone(null)}
          onViewMoreDetails={() => setIsDetailModalOpen(true)}
        />
      )}

      {/* Full Detailed Hazard Modal */}
      {selectedZone && isDetailModalOpen && (
        <ZoneDetailModal
          zone={selectedZone}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
};
