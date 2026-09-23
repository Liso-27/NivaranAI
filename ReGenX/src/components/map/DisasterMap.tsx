import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useDisasterData } from '../../context/DisasterDataContext';
import { useLanguage } from '../../context/LanguageContext';
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
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const [baseMap, setBaseMap] = useState<'standard' | 'highres_satellite' | 'nasa_gibs'>('standard');
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

  const { t, tx, tSeverity, language } = useLanguage();

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

const getGibsDateString = (): string => {
  const now = new Date();
  if (now.getUTCHours() < 4) {
    now.setUTCDate(now.getUTCDate() - 1);
  }
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

  // 1b. Manage Base Tile Layer (Standard Map vs High-Res ArcGIS Satellite vs NASA GIBS Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let tileLayer: L.TileLayer;
    if (baseMap === 'highres_satellite') {
      // High-Resolution ArcGIS World Imagery Satellite Basemap
      const arcgisApiKey = import.meta.env.VITE_ARCGIS_API_KEY;
      const tileUrl = arcgisApiKey && !arcgisApiKey.startsWith('PASTE_')
        ? `https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:Imagery:Standard?token=${arcgisApiKey}`
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

      tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
    } else if (baseMap === 'nasa_gibs') {
      const gibsDate = getGibsDateString();
      // Official NASA GIBS (Global Imagery Browse Services) EPSG:3857 Web Mercator MODIS Terra Satellite Layer
      tileLayer = L.tileLayer(
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        {
          maxNativeZoom: 9,
          maxZoom: 19,
          attribution:
            'Imagery &copy; <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA GIBS</a> &mdash; MODIS Terra TrueColor'
        }
      );
    } else {
      // Standard OpenStreetMap Raster Tiles
      const mapApiKey = import.meta.env.VITE_MAP_API_KEY;
      const tileUrl = mapApiKey && !mapApiKey.startsWith('PASTE_')
        ? `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?key=${mapApiKey}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });
    }

    tileLayer.addTo(map);
    tileLayer.bringToBack();
    baseTileLayerRef.current = tileLayer;
  }, [baseMap]);





  // 2. Render Hazard Zones Layer (Affected Radius & Severity Badges)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderHazardZonesLayer(
      layerGroupsRef.current.hazards,
      hazardZones,
      layerState,
      handleZoneSelect
    );
  }, [hazardZones, layerState, handleZoneSelect, language]);

  // 3. Render Safe Places Layer (Hospitals & Shelters)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderSafePlacesLayer(
      layerGroupsRef.current.safePlaces,
      safePlaces,
      layerState.showSafePlaces
    );
  }, [safePlaces, layerState.showSafePlaces, language]);

  // 4. Render Government Relief Camps Layer
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderGovernmentCampsLayer(
      layerGroupsRef.current.governmentCamps,
      safePlaces,
      layerState.showGovernmentCamps
    );
  }, [safePlaces, layerState.showGovernmentCamps, language]);

  // 5. Render Crowd Reports Layer (Observations & Verification Status)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderCrowdReportsLayer(
      layerGroupsRef.current.crowdReports,
      crowdReports,
      layerState.showCrowdReports
    );
  }, [crowdReports, layerState.showCrowdReports, language]);

  // 6. Render Official Field Updates Layer (BMC Mitigation Interventions)
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderOfficialUpdatesLayer(
      layerGroupsRef.current.officialUpdates,
      officialUpdates,
      layerState.showOfficialUpdates
    );
  }, [officialUpdates, layerState.showOfficialUpdates, language]);

  // 7. Render User Current Location Marker & Accuracy Radius
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    renderUserLocationLayer(
      layerGroupsRef.current.userLocation,
      userLocation
    );
  }, [userLocation, language]);

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
            placeholder={t('map.searchWardsPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFFFFF]/95 dark:bg-slate-900/95 border border-[#D1D5DB] dark:border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-xs text-[#0F172A] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D97706]/30 focus:border-[#D97706] shadow-2xs transition-all"
          />
        </form>

        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`p-2.5 rounded-lg border transition-all duration-150 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
            showLayerPanel 
              ? 'bg-[#0F172A] text-[#D97706] border-[#0F172A]' 
              : 'bg-[#FFFFFF]/95 dark:bg-slate-900/95 text-[#0F172A] dark:text-slate-300 border-[#D1D5DB] dark:border-slate-700 hover:bg-[#F8F9FA]'
          }`}
          title={t('map.toggleLayersTitle')}
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={centerOnUser}
          disabled={userLocation.isLoading}
          className={`p-2.5 bg-[#FFFFFF]/95 dark:bg-slate-900/95 hover:bg-[#F8F9FA] border rounded-lg transition-all duration-150 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
            userLocation.permissionGranted
              ? 'text-[#059669] border-[#059669]/40'
              : userLocation.permissionStatus === 'denied'
              ? 'text-[#DC2626] border-[#DC2626]/40'
              : 'text-[#0F172A] dark:text-slate-300 border-[#D1D5DB] dark:border-slate-700'
          }`}
          title={
            userLocation.isLoading 
              ? t('map.gpsAcquiring') 
              : userLocation.permissionGranted 
              ? t('map.gpsCenter') 
              : userLocation.permissionStatus === 'denied'
              ? t('map.gpsDenied')
              : t('map.gpsLocate')
          }
        >
          {userLocation.isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Geolocation Notice Banner */}
      {userLocation.error && (
        <div className="absolute top-16 left-3 right-3 md:right-auto md:max-w-md z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-rose-200 dark:border-rose-800/80 rounded-lg p-3 shadow-xl animate-fade-in flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-bold">{t('map.geoNoticeTitle')}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{userLocation.error ? tx(userLocation.error) : ''}</p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => requestUserLocation()}
                className="text-[11px] font-bold text-[#0B3D91] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> {t('map.retryLocation')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layer Toggles & Filter Panel Popover */}
      {showLayerPanel && (
        <div className="absolute top-14 left-3 z-30 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg p-4 border border-slate-200/90 dark:border-slate-700 shadow-xl animate-fade-in text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-slate-900 dark:text-white font-heading">{t('map.layersTitle')}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('map.bmcLiveData')}</span>
          </div>

          {/* Base Map Switcher */}
          <div className="space-y-1.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white font-heading text-[11px]">
                {t('map.baseMapTitle') || 'Base Map View'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">
                {baseMap}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setBaseMap('standard')}
                className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 border transition-all duration-150 cursor-pointer ${
                  baseMap === 'standard'
                    ? 'bg-[#0B3D91] text-white border-[#0B3D91] shadow-2xs dark:bg-rose-600 dark:border-rose-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={t('map.baseMapStandard') || 'Standard Map'}
              >
                <span>🗺️</span> {t('map.baseMapStandardShort') || 'Standard'}
              </button>
              <button
                type="button"
                onClick={() => setBaseMap('highres_satellite')}
                className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 border transition-all duration-150 cursor-pointer ${
                  baseMap === 'highres_satellite'
                    ? 'bg-[#0B3D91] text-white border-[#0B3D91] shadow-2xs dark:bg-rose-600 dark:border-rose-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={t('map.baseMapHighResSatellite') || 'High-Resolution Satellite'}
              >
                <span>🛰️</span> {t('map.baseMapHighResShort') || 'High-Res'}
              </button>
              <button
                type="button"
                onClick={() => setBaseMap('nasa_gibs')}
                className={`py-1.5 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 border transition-all duration-150 cursor-pointer ${
                  baseMap === 'nasa_gibs'
                    ? 'bg-[#0B3D91] text-white border-[#0B3D91] shadow-2xs dark:bg-rose-600 dark:border-rose-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={t('map.baseMapNasaSatellite') || 'NASA GIBS MODIS Satellite'}
              >
                <span>🚀</span> {t('map.baseMapNasaShort') || 'NASA GIBS'}
              </button>
            </div>

          </div>

          <div className="space-y-2">

            <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                {t('map.layerHazardZones')}
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
                {t('map.layerSafePlaces')}
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
                {t('map.layerGovCamps')}
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
                {t('map.layerCrowdReports')}
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
                {t('map.layerOfficialUpdates')}
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
            <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1.5 text-[11px]">{t('map.filterBySeverity')}</span>
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
                  {sev === 'ALL' ? t('common.all') : tSeverity(sev)}
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
          title={t('map.recenterTitle')}
        >
          <Crosshair className="w-5 h-5" />
        </button>
      )}

      {/* Leaflet Map DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 min-h-0 z-10" />

      {/* Floating Interactive Map Legend (Collapsible) */}
      <div className="absolute bottom-5 left-3 z-30 flex flex-col items-start gap-1.5 pointer-events-auto">
        {showLegend && (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg p-3.5 border border-slate-200/90 dark:border-slate-700/80 shadow-xl animate-fade-in text-[11px] space-y-2.5 max-w-xs w-64 mb-1 transition-all">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <span className="font-black text-slate-900 dark:text-white font-heading uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0B3D91] dark:text-[#F58220]" />
                {t('map.legendTitle')}
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
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">{t('map.hazardSeverity')}</span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-black text-rose-800 dark:text-rose-300">{tSeverity('EMERGENCY')}</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                  <span className="font-bold text-orange-800 dark:text-orange-300">{tSeverity('HIGH')}</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-bold text-amber-800 dark:text-amber-300">{tSeverity('MODERATE')}</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">{tSeverity('LOW')}</span>
                </div>
              </div>
            </div>

            {/* Marker Symbols */}
            <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">{t('map.markerSymbols')}</span>
              <div className="space-y-1 text-[10px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">H</span>
                  <span>{t('map.symbolHospitals')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">C</span>
                  <span>{t('map.symbolCamps')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[9px] font-bold shrink-0">📢</span>
                  <span>{t('map.symbolCrowd')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">⚡</span>
                  <span>{t('map.symbolOfficial')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 animate-pulse">📍</span>
                  <span>{t('map.symbolUserGps')}</span>
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
          <span>{showLegend ? t('map.hideLegend') : t('map.showLegend')}</span>
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
