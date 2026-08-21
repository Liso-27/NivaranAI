/**
 * NivaranAI - Crowd Reports Leaflet Layer
 * 
 * Renders citizen ground observations with verification state tags and corroboration metrics.
 */

import L from 'leaflet';
import { CrowdReport } from '../../../types';

export function renderCrowdReportsLayer(
  layerGroup: L.LayerGroup,
  crowdReports: CrowdReport[],
  showCrowdReports: boolean
): void {
  layerGroup.clearLayers();

  if (!showCrowdReports) return;

  crowdReports.forEach(report => {
    const lat = Number(report.latitude);
    const lng = Number(report.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    const isVerified = report.verification_state === 'VERIFIED';
    const isDisputed = report.verification_state === 'DISPUTED';
    const isCorroborated = report.verification_state === 'CORROBORATED';

    const color = isVerified 
      ? '#10b981' 
      : isDisputed 
      ? '#ef4444' 
      : isCorroborated 
      ? '#3b82f6' 
      : '#f59e0b';

    const icon = L.divIcon({
      className: 'custom-crowd-marker',
      html: `
        <div style="
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid ${color};
          border-radius: 9999px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          📢
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([lat, lng], { icon });

    let formattedTime = 'Date unavailable';
    if (report.timestamp || report.created_at) {
      try {
        const d = new Date(report.timestamp || report.created_at || '');
        if (!isNaN(d.getTime())) {
          formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {}
    }

    marker.bindPopup(`
      <div style="padding: 6px 8px; font-size: 11px; min-width: 190px; line-height: 1.4; color: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: ${color}25; color: ${color}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${color}50;">
            ${report.verification_state}
          </span>
          <span style="font-size: 10px; color: #94a3b8;">${report.corroborations_count || 1} Reports</span>
        </div>

        <h4 style="font-size: 12px; font-weight: 700; color: #ffffff; margin: 3px 0 2px;">
          ${report.observation_type.replace('_', ' ').toUpperCase()}
        </h4>
        <p style="font-size: 11px; color: #cbd5e1; margin: 4px 0 6px; line-height: 1.35;">
          ${report.description}
        </p>

        <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
          📍 ${report.ward_name} ${report.landmark ? `• ${report.landmark}` : ''}
          <div style="color: #64748b; margin-top: 2px;">Reported at: ${formattedTime}</div>
        </div>

        ${report.official_note ? `
          <p style="margin-top: 6px; font-size: 10px; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 4px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.3);">
            <strong>Official Action:</strong> ${report.official_note}
          </p>
        ` : ''}
      </div>
    `);

    marker.addTo(layerGroup);
  });
}
