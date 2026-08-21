/**
 * NivaranAI - Official Updates Leaflet Layer
 * 
 * Renders verified BMC official mitigation actions and drainage intervention markers.
 */

import L from 'leaflet';
import { OfficialFieldUpdate } from '../../../types';

export function renderOfficialUpdatesLayer(
  layerGroup: L.LayerGroup,
  officialUpdates: OfficialFieldUpdate[],
  showOfficialUpdates: boolean
): void {
  layerGroup.clearLayers();

  if (!showOfficialUpdates) return;

  officialUpdates.forEach(update => {
    const lat = Number(update.latitude);
    const lng = Number(update.longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    const isCompleted = update.mitigation_status === 'FULLY_MITIGATED' || update.mitigation_status === 'RESOLVED';
    const isPartial = update.mitigation_status === 'PARTIALLY_MITIGATED';
    const markerColor = isCompleted ? '#10b981' : isPartial ? '#0284c7' : '#f59e0b';

    const icon = L.divIcon({
      className: 'custom-official-marker',
      html: `
        <div style="
          background: #0284c7;
          border: 2px solid #ffffff;
          border-radius: 8px;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 0 15px rgba(2,132,199,0.7);
          cursor: pointer;
          white-space: nowrap;
        ">
          ⚡ <span>${(update.mitigation_status || 'ACTION').replace('_', ' ')}</span>
        </div>
      `,
      iconAnchor: [45, 16]
    });

    const marker = L.marker([lat, lng], { icon });

    let formattedTime = 'Active';
    if (update.submitted_at) {
      try {
        const d = new Date(update.submitted_at);
        if (!isNaN(d.getTime())) {
          formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {}
    }

    marker.bindPopup(`
      <div style="padding: 6px 8px; font-size: 11px; min-width: 190px; line-height: 1.4; color: #f8fafc;">
        <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #38bdf8; margin-bottom: 2px;">
          OFFICIAL BMC MITIGATION ACTION
        </div>
        <h4 style="font-size: 12px; font-weight: 700; color: #ffffff; margin: 2px 0 4px;">
          ${update.ward_name}
        </h4>
        <p style="font-size: 11px; color: #e2e8f0; margin-bottom: 4px;">
          <strong>Status:</strong> <span style="color: ${markerColor};">${(update.mitigation_status || update.official_status || update.status || 'ACTION').replace('_', ' ')}</span>
        </p>
        <p style="font-size: 11px; color: #94a3b8; margin-bottom: 4px; line-height: 1.35;">
          ${update.official_note}
        </p>
        ${update.action_taken ? `
          <p style="font-size: 10px; color: #34d399; margin-bottom: 4px;">
            <b>Action:</b> ${update.action_taken}
          </p>
        ` : ''}
        <div style="font-size: 10px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
          <div>Officer: ${update.official_name} (${update.official_department})</div>
          <div style="margin-top: 2px;">Logged at: ${formattedTime}</div>
        </div>
      </div>
    `);

    marker.addTo(layerGroup);
  });
}
