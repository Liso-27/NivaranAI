import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  HazardZone, 
  SafePlace, 
  CrowdReport, 
  NewsArticle, 
  OfficialFieldUpdate, 
  MapLayerState, 
  UserLocationState, 
  HazardType, 
  SeverityLevel, 
  VerificationState 
} from '../types';
import { disasterApi } from '../services/api';
import { BHUBANESWAR_CENTER } from '../data/bmcWards';
import { 
  getCurrentLocation, 
  getCachedLocation, 
  getGeolocationPermissionStatus 
} from '../services/locationService';

interface DisasterDataContextType {
  hazardZones: HazardZone[];
  safePlaces: SafePlace[];
  crowdReports: CrowdReport[];
  newsArticles: NewsArticle[];
  officialUpdates: OfficialFieldUpdate[];
  selectedZone: HazardZone | null;
  layerState: MapLayerState;
  userLocation: UserLocationState;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedZone: (zone: HazardZone | null) => void;
  toggleLayer: (layer: keyof Omit<MapLayerState, 'selectedHazardFilter' | 'selectedSeverityFilter'>) => void;
  setHazardFilter: (filter: HazardType | 'ALL') => void;
  setSeverityFilter: (filter: SeverityLevel | 'ALL') => void;
  requestUserLocation: () => Promise<void>;
  submitCrowdReport: (data: any) => Promise<CrowdReport>;
  verifyCrowdReport: (id: string, state: VerificationState, note: string, officialName: string) => Promise<void>;
  corroborateCrowdReport: (id: string) => Promise<void>;
  createGovernmentCamp: (data: any) => Promise<SafePlace>;
  updateCampCapacity: (id: string, occupied: number, status?: 'OPEN' | 'FULL' | 'CLOSED' | 'STANDBY') => Promise<void>;
  submitOfficialUpdate: (data: any) => Promise<OfficialFieldUpdate>;
  refreshData: () => Promise<void>;
}

const DisasterDataContext = createContext<DisasterDataContextType | undefined>(undefined);

export const DisasterDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hazardZones, setHazardZones] = useState<HazardZone[]>(() => {
    try {
      const saved = localStorage.getItem('nivaran_cached_hazard_zones');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [crowdReports, setCrowdReports] = useState<CrowdReport[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [officialUpdates, setOfficialUpdates] = useState<OfficialFieldUpdate[]>([]);
  const [selectedZone, setSelectedZone] = useState<HazardZone | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Layer State
  const [layerState, setLayerState] = useState<MapLayerState>({
    showHazardZones: true,
    showSafePlaces: true,
    showGovernmentCamps: true,
    showCrowdReports: true,
    showOfficialUpdates: true,
    selectedHazardFilter: 'ALL',
    selectedSeverityFilter: 'ALL'
  });

  // User Location State
  const [userLocation, setUserLocation] = useState<UserLocationState>(() => {
    const cached = getCachedLocation();
    return {
      latitude: cached ? cached.latitude : BHUBANESWAR_CENTER.lat,
      longitude: cached ? cached.longitude : BHUBANESWAR_CENTER.lng,
      accuracy: cached ? cached.accuracy : null,
      timestamp: cached ? cached.timestamp : null,
      permissionGranted: !!cached,
      permissionStatus: 'idle',
      isLoading: false,
      error: null,
      isInsideHazardZone: false,
      currentHazardZone: null,
      nearestSafePlace: null
    };
  });

  const refreshData = useCallback(async () => {
    try {
      setError(null);
      const [zones, places, reports, news, updates] = await Promise.all([
        disasterApi.getHazardZones(),
        disasterApi.getSafePlaces(userLocation.latitude || undefined, userLocation.longitude || undefined),
        disasterApi.getCrowdReports(),
        disasterApi.getNewsArticles(),
        disasterApi.getOfficialUpdates()
      ]);
      setHazardZones(zones);
      try {
        localStorage.setItem('nivaran_cached_hazard_zones', JSON.stringify(zones));
      } catch {
        // Safe fallback for quota or disabled storage
      }
      setSafePlaces(places);
      setCrowdReports(reports);
      setNewsArticles(news);
      setOfficialUpdates(updates);
    } catch (err: any) {
      setError(err.message || 'Failed to load disaster data from backend');
    } finally {
      setIsLoading(false);
    }
  }, [userLocation.latitude, userLocation.longitude]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Request User Geolocation via Browser HTML5 API
  const requestUserLocation = useCallback(async () => {
    setUserLocation(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    const result = await getCurrentLocation();

    if (result.success && result.location) {
      setUserLocation(prev => ({
        ...prev,
        latitude: result.location!.latitude,
        longitude: result.location!.longitude,
        accuracy: result.location!.accuracy,
        timestamp: result.location!.timestamp,
        permissionGranted: true,
        permissionStatus: result.permissionStatus,
        isLoading: false,
        error: null
      }));
    } else {
      setUserLocation(prev => ({
        ...prev,
        permissionGranted: false,
        permissionStatus: result.permissionStatus,
        isLoading: false,
        error: result.error || 'Unable to determine device location.'
      }));
    }
  }, []);

  // Inspect initial geolocation permission state
  useEffect(() => {
    getGeolocationPermissionStatus().then(status => {
      if (status === 'granted') {
        requestUserLocation();
      } else {
        setUserLocation(prev => ({ ...prev, permissionStatus: status }));
      }
    });
  }, [requestUserLocation]);

  const toggleLayer = (layer: keyof Omit<MapLayerState, 'selectedHazardFilter' | 'selectedSeverityFilter'>) => {
    setLayerState(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const setHazardFilter = (filter: HazardType | 'ALL') => {
    setLayerState(prev => ({ ...prev, selectedHazardFilter: filter }));
  };

  const setSeverityFilter = (filter: SeverityLevel | 'ALL') => {
    setLayerState(prev => ({ ...prev, selectedSeverityFilter: filter }));
  };

  const submitCrowdReport = async (data: any) => {
    const report = await disasterApi.submitCrowdReport(data);
    setCrowdReports(prev => [report, ...prev]);
    return report;
  };

  const verifyCrowdReport = async (id: string, state: VerificationState, note: string, officialName: string) => {
    const updated = await disasterApi.verifyCrowdReport(id, state, note, officialName);
    setCrowdReports(prev => prev.map(r => r.id === id ? { ...r, ...updated, verification_state: state } : r));
  };

  const corroborateCrowdReport = async (id: string) => {
    const updated = await disasterApi.corroborateCrowdReport(id);
    setCrowdReports(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  };

  const createGovernmentCamp = async (data: any) => {
    const camp = await disasterApi.createGovernmentCamp(data);
    setSafePlaces(prev => [camp, ...prev]);
    return camp;
  };

  const updateCampCapacity = async (id: string, occupied: number, status?: 'OPEN' | 'FULL' | 'CLOSED' | 'STANDBY') => {
    const updated = await disasterApi.updateCampCapacity(id, occupied, status);
    setSafePlaces(prev => prev.map(s => s.id === id ? updated : s));
  };

  const submitOfficialUpdate = async (data: any) => {
    const update = await disasterApi.submitOfficialUpdate(data);
    setOfficialUpdates(prev => [update, ...prev]);
    return update;
  };

  return (
    <DisasterDataContext.Provider
      value={{
        hazardZones,
        safePlaces,
        crowdReports,
        newsArticles,
        officialUpdates,
        selectedZone,
        layerState,
        userLocation,
        isLoading,
        error,
        setSelectedZone,
        toggleLayer,
        setHazardFilter,
        setSeverityFilter,
        requestUserLocation,
        submitCrowdReport,
        verifyCrowdReport,
        corroborateCrowdReport,
        createGovernmentCamp,
        updateCampCapacity,
        submitOfficialUpdate,
        refreshData
      }}
    >
      {children}
    </DisasterDataContext.Provider>
  );
};

export const useDisasterData = () => {
  const context = useContext(DisasterDataContext);
  if (!context) {
    throw new Error('useDisasterData must be used within a DisasterDataProvider');
  }
  return context;
};
