import { 
  HazardZone, 
  SafePlace, 
  CrowdReport, 
  NewsArticle, 
  OfficialFieldUpdate, 
  SchedulerTelemetry, 
  ServiceHealthMetric, 
  AuditLogEntry, 
  UserProfile, 
  VerificationState, 
  OfficialApprovalStatus,
  SeverityLevel,
  SEVERITY_COLORS
} from '../types';
import { BMC_WARDS } from '../data/bmcWards';

const DEFAULT_API_URL = import.meta.env.PROD 
  ? 'https://nivaranai-10j7.onrender.com' 
  : 'http://127.0.0.1:5000';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL;
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

class DisasterApiClient {
  
  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_session_token');
    
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP Error ${response.status}`);
    }

    return response.json();
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  async login(emailOrPhone: string, password: string): Promise<{session_token: string; user: UserProfile}> {
    return this.fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailOrPhone, password })
    });
  }

  async loginWithGoogle(idToken: string): Promise<{session_token: string; user: UserProfile}> {
    return this.fetchApi('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken })
    });
  }

  async registerCitizen(data: any): Promise<any> {
    return this.fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'CITIZEN' })
    });
  }

  async registerOfficial(data: any): Promise<any> {
    return this.fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'GOVERNMENT_OFFICIAL' })
    });
  }

  async updateCitizenPreferences(data: { phone_number?: string; notification_sms_enabled?: boolean }): Promise<any> {
    return this.fetchApi('/api/auth/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // RISK & HAZARD ZONES
  // ==========================================
  async getHazardZones(): Promise<HazardZone[]> {
    const raw = await this.fetchApi<any[]>('/api/hazards');
    if (!Array.isArray(raw)) return [];

    return raw.map(item => {
      const rawWard = item.ward_id;
      const wardNum = typeof rawWard === 'number' ? rawWard : (parseInt(String(rawWard || '').replace(/\D/g, ''), 10) || 1);
      const score = typeof item.risk_score === 'number' && !isNaN(item.risk_score) ? item.risk_score : 0;
      const conf = typeof item.confidence === 'number' && !isNaN(item.confidence) ? item.confidence : 80;
      const radKm = typeof item.affected_radius_km === 'number' && !isNaN(item.affected_radius_km) ? item.affected_radius_km : 1.5;
      const lat = typeof item.latitude === 'number' && !isNaN(item.latitude) ? item.latitude : 20.2961;
      const lng = typeof item.longitude === 'number' && !isNaN(item.longitude) ? item.longitude : 85.8245;

      const severity: SeverityLevel = ['LOW', 'MODERATE', 'HIGH', 'EMERGENCY'].includes(item.severity) ? item.severity : 'LOW';
      const color = item.color || (SEVERITY_COLORS as any)[severity] || '#22C55E';

      return {
        ...item,
        id: item.id || `${item.ward_id || wardNum}-${item.hazard_type || 'hazard'}`,
        ward_id: wardNum,
        ward_name: item.ward_name || `Ward ${wardNum}`,
        hazard_type: item.hazard_type || 'heavy_rainfall',
        severity: severity,
        risk_score: score,
        confidence: conf,
        affected_radius_km: radKm,
        latitude: lat,
        longitude: lng,
        color: color,
        is_worst_hazard: item.is_worst_hazard ?? true,
        short_description: item.short_description || `${item.hazard_type || 'Hazard'} risk is ${severity} in Ward ${wardNum}.`,
        last_updated: item.last_updated || new Date().toISOString()
      };
    });
  }

  async getHazardZoneById(zoneId: string): Promise<HazardZone | null> {
    const zones = await this.getHazardZones();
    return zones.find(z => z.id === zoneId) || null;
  }

  async getHazardZoneByWard(wardId: number | string): Promise<HazardZone | null> {
    const zones = await this.getHazardZones();
    const wardNum = typeof wardId === 'number' ? wardId : (parseInt(String(wardId || '').replace(/\D/g, ''), 10) || 1);
    return zones.find(z => z.ward_id === wardNum || String(z.ward_id) === String(wardId)) || null;
  }

  // ==========================================
  // SAFE PLACES & CAMPS
  // ==========================================
  async getSafePlaces(userLat?: number, userLng?: number): Promise<SafePlace[]> {
    let list = await this.fetchApi<any[]>('/api/safe-places');
    if (!Array.isArray(list)) return [];

    const normalizedList: SafePlace[] = list.map(sp => {
      const tot = typeof sp.total_capacity === 'number' ? sp.total_capacity : (typeof sp.capacity === 'number' ? sp.capacity : (parseInt(String(sp.total_capacity || sp.capacity || 0), 10) || 0));
      const avail = typeof sp.available_beds === 'number' ? sp.available_beds : (typeof sp.available_capacity === 'number' ? sp.available_capacity : tot);
      const occ = typeof sp.occupied_capacity === 'number' ? sp.occupied_capacity : Math.max(0, tot - avail);

      const rawWard = sp.ward_id;
      const wardNum = typeof rawWard === 'number' ? rawWard : (parseInt(String(rawWard || '').replace(/\D/g, ''), 10) || 1);

      return {
        ...sp,
        id: sp.id || sp.$id || `sp-${Math.random()}`,
        total_capacity: tot,
        capacity: tot,
        occupied_capacity: occ,
        available_beds: avail,
        available_capacity: avail,
        ward_id: wardNum,
        ward_name: sp.ward_name || `Ward #${wardNum}`,
        status: sp.status || 'ACTIVE'
      };
    });

    if (userLat !== undefined && userLng !== undefined) {
      normalizedList.forEach(sp => {
        const d = this.calculateHaversineDistance(userLat, userLng, sp.latitude, sp.longitude);
        sp.distance_km = parseFloat(d.toFixed(2));
      });
      normalizedList.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    }

    return normalizedList;
  }

  async createGovernmentCamp(campData: {
    name: string;
    type: 'government_camp' | 'temporary_camp';
    address: string;
    ward_id: number;
    ward_name: string;
    latitude: number;
    longitude: number;
    total_capacity: number;
    contact_number: string;
    facilities: string[];
  }): Promise<SafePlace> {
    return this.fetchApi<SafePlace>('/api/camps', {
      method: 'POST',
      body: JSON.stringify(campData)
    });
  }

  async updateCampCapacity(
    campId: string, 
    occupiedCapacity: number, 
    status?: 'OPEN' | 'FULL' | 'CLOSED' | 'STANDBY'
  ): Promise<SafePlace> {
    const body: any = { occupied_capacity: occupiedCapacity };
    if (status) body.status = status;
    
    return this.fetchApi<SafePlace>(`/api/camps/${campId}/capacity`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // ==========================================
  // CROWD SOURCING
  // ==========================================
  async getCrowdReports(): Promise<CrowdReport[]> {
    const raw = await this.fetchApi<any[]>('/api/reports');
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
      const st = String(item.status || item.verification_state || 'PENDING').toUpperCase();
      let verState: VerificationState = 'UNVERIFIED';
      if (st === 'VERIFIED') verState = 'VERIFIED';
      else if (st === 'REJECTED' || st === 'DISPUTED') verState = 'DISPUTED';

      const rawWard = item.ward_id;
      const wardNum = typeof rawWard === 'number' ? rawWard : (parseInt(String(rawWard || '').replace(/\D/g, ''), 10) || 1);
      const notes = item.official_notes || item.official_note || item.official_remarks || '';
      const ts = item.timestamp || item.created_at || new Date().toISOString();

      return {
        ...item,
        id: item.id || item.$id || `report-${Math.random()}`,
        ward_id: wardNum,
        ward_name: item.ward_name || `Ward ${wardNum}`,
        verification_state: verState,
        timestamp: ts,
        created_at: ts,
        official_notes: notes,
        official_note: notes,
        official_remarks: notes,
        reported_by_name: item.reported_by_name || item.citizen_name || item.user_id || 'Citizen',
        corroboration_count: item.corroboration_count ?? item.confirm_count ?? 1,
        corroborations_count: item.corroborations_count ?? item.confirm_count ?? 1,
        waterlogging_present: item.waterlogging_present || 'YES',
        road_passable: item.road_passable || 'YES',
        power_outage: item.power_outage || 'NO',
        structural_damage: item.structural_damage || 'NO',
        description: item.description || 'Disaster observation reported by citizen.'
      };
    });
  }

  async submitCrowdReport(reportData: {
    citizen_id: string;
    citizen_name?: string;
    observation_type: any;
    description: string;
    responses: Record<string, 'YES' | 'NO' | 'UNKNOWN'>;
    ward_id: number;
    ward_name: string;
    latitude: number;
    longitude: number;
    landmark?: string;
    photo_url?: string;
  }): Promise<CrowdReport> {
    return this.fetchApi<CrowdReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  async verifyCrowdReport(
    reportId: string, 
    newState: VerificationState, 
    officialNote: string,
    officialName: string
  ): Promise<CrowdReport> {
    const res = await this.fetchApi<any>(`/api/reports/${reportId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ new_state: newState, official_note: officialNote, official_name: officialName })
    });
    
    const st = String(res.status || res.verification_state || newState).toUpperCase();
    let verState: VerificationState = 'UNVERIFIED';
    if (st === 'VERIFIED') verState = 'VERIFIED';
    else if (st === 'REJECTED' || st === 'DISPUTED') verState = 'DISPUTED';

    const notes = res.official_notes || res.official_note || res.official_remarks || officialNote;
    const ts = res.timestamp || res.created_at || res.updated_at || new Date().toISOString();

    return {
      ...res,
      id: res.id || res.$id || reportId,
      verification_state: verState,
      official_notes: notes,
      official_note: notes,
      official_remarks: notes,
      timestamp: ts,
      updated_at: ts
    };
  }

  async corroborateCrowdReport(reportId: string): Promise<CrowdReport> {
    return this.fetchApi<CrowdReport>(`/api/reports/${reportId}/corroborate`, {
      method: 'POST'
    });
  }

  // ==========================================
  // OFFICIAL FIELD UPDATES
  // ==========================================
  async getOfficialUpdates(): Promise<OfficialFieldUpdate[]> {
    return this.fetchApi<OfficialFieldUpdate[]>('/api/official-updates');
  }

  async submitOfficialUpdate(data: {
    official_id: string;
    official_name: string;
    official_department: string;
    ward_id: number;
    ward_name: string;
    hazard_type: any;
    mitigation_status: any;
    official_note: string;
    action_taken: string;
    latitude: number;
    longitude: number;
    duration_hours: number;
  }): Promise<OfficialFieldUpdate> {
    return this.fetchApi<OfficialFieldUpdate>('/api/official-updates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==========================================
  // NEWS AGGREGATOR
  // ==========================================
  async getNewsArticles(locality?: string, wardId?: number): Promise<NewsArticle[]> {
    let url = '/api/news?';
    if (locality) url += `locality=${encodeURIComponent(locality)}&`;
    if (wardId) url += `ward_id=${wardId}`;
    return this.fetchApi<NewsArticle[]>(url);
  }

  // ==========================================
  // USER LOCATION & HAZARD EVALUATOR
  // ==========================================
  async evaluateUserLocation(lat: number, lng: number): Promise<{
    isInsideHazardZone: boolean;
    activeZone: HazardZone | null;
    nearestSafePlace: SafePlace | null;
    currentWard: typeof BMC_WARDS[0] | null;
  }> {
    // The backend endpoint returns all this
    return this.fetchApi('/api/evaluate-location', {
      method: 'POST',
      body: JSON.stringify({ latitude: lat, longitude: lng })
    });
  }

  // ==========================================
  // TELEMETRY & SYSTEM ADMIN
  // ==========================================
  async getSchedulerTelemetry(): Promise<SchedulerTelemetry> {
    return this.fetchApi<SchedulerTelemetry>('/api/admin/telemetry');
  }

  async getServicesHealth(): Promise<ServiceHealthMetric[]> {
    // Mocked fallback since it's not exposed properly in backend, but we can return empty if it fails
    try {
      return await this.fetchApi<ServiceHealthMetric[]>('/api/admin/health');
    } catch {
      return [];
    }
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return this.fetchApi<AuditLogEntry[]>('/api/admin/audit-logs');
  }

  async getUsersList(): Promise<UserProfile[]> {
    return this.fetchApi<UserProfile[]>('/api/admin/users');
  }

  async updateOfficialApproval(userId: string, status: OfficialApprovalStatus): Promise<UserProfile> {
    return this.fetchApi<UserProfile>(`/api/admin/users/${userId}/approval`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // ==========================================
  // AI DISASTER INTELLIGENCE LAYER
  // ==========================================
  async parseReportText(text: string, locationHint?: string): Promise<any> {
    return this.fetchApi('/api/ai/parse-report', {
      method: 'POST',
      body: JSON.stringify({ text, location_hint: locationHint })
    });
  }

  async getSituationBrief(wardId: string | number): Promise<any> {
    return this.fetchApi(`/api/ai/situation-brief?ward_id=${wardId}`);
  }

  async askAiQuestion(question: string, wardId?: string | number): Promise<any> {
    return this.fetchApi('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, ward_id: wardId })
    });
  }

  async getAiRoleSummary(wardId: string | number, role: string = 'citizen'): Promise<any> {
    return this.fetchApi(`/api/ai/role-summary?ward_id=${wardId}&role=${role}`);
  }

  // FCM Device Registration Token sync
  async registerDeviceToken(data: { fcm_token: string; user_id?: string; latitude?: number; longitude?: number }): Promise<any> {
    return this.fetchApi('/api/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // TEMPORARY FCM TEST CALL (Remove after verification)
  async sendTestFcm(fcmToken: string): Promise<any> {
    return this.fetchApi('/api/notifications/test-fcm', {
      method: 'POST',
      body: JSON.stringify({ fcm_token: fcmToken })
    });
  }

  // Haversine formula for exact distance in KM
  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const disasterApi = new DisasterApiClient();
