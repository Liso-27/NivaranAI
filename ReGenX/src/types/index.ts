// Severity and Hazard Types
export type HazardType = 
  | 'heavy_rainfall'
  | 'flood'
  | 'waterlogging'
  | 'lightning'
  | 'cyclone';

export type SeverityLevel = 
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'EMERGENCY';

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  LOW: '#22C55E',
  MODERATE: '#EAB308',
  HIGH: '#F97316',
  EMERGENCY: '#EF4444'
};

export const SEVERITY_BG_CLASSES: Record<SeverityLevel, string> = {
  LOW: 'bg-emerald-100/80 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
  MODERATE: 'bg-amber-100/80 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
  HIGH: 'bg-orange-100/80 text-orange-950 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40',
  EMERGENCY: 'bg-rose-100/90 text-rose-950 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
};

// Bhubaneswar Municipal Corporation (BMC) Ward
export interface BMCWard {
  ward_id: number;
  ward_name: string;
  zone: 'North' | 'South-West' | 'South-East';
  centroid_lat: number;
  centroid_lng: number;
  population: number;
  area_sq_km: number;
  vulnerability_factor: number;
}

// Hazard Zone from risk_engine.py & map_zones.py
export interface HazardZone {
  id: string;
  ward_id: number;
  ward_name: string;
  hazard_type: HazardType;
  latitude: number;
  longitude: number;
  centroid_lat?: number;
  centroid_lng?: number;
  risk_score: number; // 0 to 100
  severity: SeverityLevel;
  confidence: number; // 0 to 100 percentage
  affected_radius_km: number; // authoritative from backend
  color: string; // #22C55E | #EAB308 | #F97316 | #EF4444
  short_description: string;
  description?: string;
  weather_data?: {
    rainfall_mm?: number;
    wind_speed_kmh?: number;
    lightning_strikes?: number;
    water_level_cm?: number;
    humidity?: number;
    temperature_c?: number;
  };
  weather_metrics?: {
    rainfall_mm_per_hr?: number;
    water_depth_cm?: number;
    wind_speed_kmh?: number;
    temperature_c?: number;
  };
  recommended_action?: string;
  is_worst_hazard?: boolean;
  last_updated?: string;
}

// Emergency Safe Places from emergency_locations.py
export type SafePlaceType = 
  | 'hospital'
  | 'police_station'
  | 'fire_station'
  | 'official_shelter'
  | 'relief_centre'
  | 'government_camp'
  | 'temporary_camp';

export type SafePlaceStatus = 
  | 'OPEN'
  | 'FULL'
  | 'STANDBY'
  | 'CLOSED';

export interface SafePlace {
  id: string;
  name: string;
  type: SafePlaceType;
  address: string;
  ward_id: number;
  ward_name?: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  capacity?: number;
  occupied_capacity: number;
  available_beds: number;
  available_capacity?: number;
  status?: SafePlaceStatus;
  contact_number?: string;
  contact_phone?: string;
  government_verified?: boolean;
  is_hazard_excluded?: boolean;
  is_excluded_from_routing?: boolean;
  hazard_exclusion_reason?: string;
  distance_km?: number;
  facilities?: string[];
  last_updated?: string;
}

// Crowd-sourced Observations from crowd_updates.py
export type ObservationType = 
  | 'road_damage'
  | 'road_blocked'
  | 'waterlogging'
  | 'flooding'
  | 'heavy_rain'
  | 'lightning'
  | 'power_outage'
  | 'other';

export type QuestionResponse = 'YES' | 'NO' | 'UNKNOWN';

export type VerificationState = 
  | 'UNVERIFIED'
  | 'VERIFIED'
  | 'DISPUTED'
  | 'CORROBORATED';

export interface CrowdReport {
  id: string;
  citizen_id?: string;
  citizen_name?: string;
  reported_by_name?: string;
  reported_by_role?: string;
  observation_type: ObservationType;
  description: string;
  responses?: Record<string, QuestionResponse>;
  waterlogging_present?: QuestionResponse;
  waterlogging_depth_cm?: number;
  road_passable?: QuestionResponse;
  power_outage?: QuestionResponse;
  structural_damage?: QuestionResponse;
  ward_id: number;
  ward_name: string;
  latitude: number;
  longitude: number;
  landmark?: string;
  photo_url?: string;
  timestamp: string;
  created_at?: string;
  corroborations_count: number;
  corroboration_count?: number;
  verification_state: VerificationState;
  official_note?: string;
  official_notes?: string;
  official_remarks?: string;
  reviewed_by_name?: string;
  verified_by?: string;
  verified_at?: string;
}

// News Service from news_service.py
export type NewsScope = 'LOCALITY' | 'CITYWIDE' | 'REGIONAL';

export interface NewsArticle {
  id: string;
  title: string;
  overview?: string;
  summary?: string;
  hazard_type?: HazardType;
  locality: string;
  ward_id?: number;
  scope: NewsScope;
  source: string;
  url: string;
  image_url?: string;
  published_at: string;
  is_ticker: boolean;
}

// Official Field Updates from government officials
export type MitigationStatus = 
  | 'CONFIRMED'
  | 'PARTIALLY_MITIGATED'
  | 'FULLY_MITIGATED'
  | 'RESOLVED'
  | 'INCORRECT_REPORT'
  | 'DISPUTED';

export interface OfficialFieldUpdate {
  id: string;
  official_id?: string;
  official_name: string;
  official_department: string;
  ward_id: number;
  ward_name: string;
  hazard_type?: HazardType;
  status?: MitigationStatus;
  mitigation_status: MitigationStatus;
  official_note?: string;
  remarks?: string;
  action_taken?: string;
  pumps_deployed?: number;
  shelter_activated?: boolean;
  latitude: number;
  longitude: number;
  timestamp?: string;
  submitted_at?: string;
  expires_at?: string;
  is_active?: boolean;
}

// User Authentication & Roles from auth_service.py
export type UserRole = 'CITIZEN' | 'GOVERNMENT_OFFICIAL' | 'SYSTEM_ADMIN';

export type OfficialApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone_number?: string;
  notification_sms_enabled: boolean;
  fcm_token?: string;
  department?: string;
  designation?: string;
  official_status?: OfficialApprovalStatus;
  created_at: string;
}

// Notification Item for In-App Feed
export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  hazard_type: HazardType;
  severity: SeverityLevel;
  ward_name: string;
  ward_id: number;
  timestamp: string;
  read: boolean;
  is_read?: boolean;
  channel: 'IN_APP' | 'FCM_PUSH' | 'TWILIO_SMS';
}

// System Admin Telemetry & 20-min Scheduled Runner
export interface SchedulerTelemetry {
  is_running: boolean;
  cron_expression: string; // '*/20 * * * *'
  frequency_minutes: number;
  last_execution_time: string;
  execution_duration_sec: number;
  wards_evaluated: number;
  zones_changed: number;
  notifications_triggered: number;
  next_expected_execution: string;
  health_status: 'HEALTHY' | 'DEGRADED' | 'ERROR';
}

export interface ServiceHealthMetric {
  name: 'Risk Engine' | 'Open-Meteo' | 'Tomorrow.io' | 'Appwrite' | 'News API' | 'Gemini' | 'FCM' | 'Twilio' | 'Scheduler';
  status: 'OPERATIONAL' | 'WARNING' | 'UNAVAILABLE';
  latency_ms: number;
  last_checked: string;
  details: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action_type: string;
  target_type: 'REPORT' | 'CAMP' | 'OFFICIAL_UPDATE' | 'USER' | 'SCHEDULER';
  target_id: string;
  details: string;
}

// Map View Filter and Layer State
export interface MapLayerState {
  showHazardZones: boolean;
  showSafePlaces: boolean;
  showGovernmentCamps: boolean;
  showCrowdReports: boolean;
  showOfficialUpdates: boolean;
  selectedHazardFilter: HazardType | 'ALL';
  selectedSeverityFilter: SeverityLevel | 'ALL';
}

// Location Tracking State
export type GeolocationPermissionState = 'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'error';

export interface UserLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  permissionGranted: boolean;
  permissionStatus?: GeolocationPermissionState;
  isLoading?: boolean;
  error?: string | null;
  isInsideHazardZone?: boolean;
  ward_id?: number;
  ward_name?: string;
  currentHazardZone?: HazardZone | null;
  nearestSafePlace?: SafePlace | null;
}
