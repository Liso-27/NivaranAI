/**
 * NivaranAI - Government Camps Leaflet Layer
 * 
 * Renders government relief camps and emergency shelters with occupancy and amenities details.
 */

import L from 'leaflet';
import { SafePlace } from '../../../types';

export function renderGovernmentCampsLayer(
  layerGroup: L.LayerGroup,
  safePlaces: SafePlace[],
  showGovernmentCamps: boolean
): void {
  layerGroup.clearLayers();

  if (!showGovernmentCamps) return;

  // Filter government relief camps and temporary shelters
  const camps = safePlaces.filter(
    p => p.type === 'government_camp' || p.type === 'temporary_camp' || p.type === 'official_shelter'
  );

  camps.forEach(camp => {
    const isExcluded = camp.is_hazard_excluded;
    const isFull = camp.status === 'FULL' || camp.status === 'CLOSED';
    const markerColor = isExcluded ? '#64748b' : '#0284c7'; // Sky blue / cyan for government camps
    const tot = Number(camp.total_capacity) || Number(camp.capacity) || 0;
    const occ = Number(camp.occupied_capacity) || 0;
    const availableBeds = typeof camp.available_beds === 'number' ? camp.available_beds : Math.max(0, tot - occ);

    const icon = L.divIcon({
      className: 'custom-camp-marker',
      html: `
        <div style="
          background: rgba(15, 23, 42, 0.95);
          border: 2px solid ${markerColor};
          border-radius: 8px;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(2,132,199,0.4);
          opacity: ${isExcluded || isFull ? 0.65 : 1};
          cursor: pointer;
          white-space: nowrap;
        ">
          <span>🏕️</span>
          <span style="max-width: 95px; overflow: hidden; text-overflow: ellipsis;">${(camp.name || 'Camp').split(' ')[0]} Camp</span>
          <span style="background: rgba(2,132,199,0.25); color: #38bdf8; font-size: 9px; padding: 1px 4px; border-radius: 4px;">
            ${availableBeds}
          </span>
        </div>
      `,
      iconAnchor: [40, 16]
    });

    const marker = L.marker([camp.latitude, camp.longitude], { icon });

    marker.bindPopup(`
      <div style="padding: 6px 8px; font-size: 11px; min-width: 190px; line-height: 1.4; color: #f8fafc;">
        <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #38bdf8; margin-bottom: 2px;">
          🏕️ BMC GOVERNMENT RELIEF CAMP
        </div>
        <h4 style="font-size: 12px; font-weight: 700; color: #ffffff; margin: 2px 0 4px;">${camp.name}</h4>
        <p style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">${camp.address}</p>

        <div style="font-size: 11px; color: #e2e8f0; display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
          <span>Occupancy: <b>${occ}/${tot}</b></span>
          <span style="color: ${availableBeds > 0 ? '#34d399' : '#f87171'}; font-weight: 700;">
            ${availableBeds > 0 ? `${availableBeds} spots open` : 'Full Capacity'}
          </span>
        </div>

        ${camp.facilities && camp.facilities.length > 0 ? `
          <div style="margin-top: 5px; font-size: 10px; color: #cbd5e1;">
            <b>Amenities:</b> ${camp.facilities.join(', ')}
          </div>
        ` : ''}

        ${camp.contact_number ? `
          <div style="margin-top: 4px; font-size: 10px; color: #38bdf8;">
            <b>Camp Control:</b> ${camp.contact_number}
          </div>
        ` : ''}

        ${camp.hazard_exclusion_reason ? `
          <p style="margin-top: 6px; font-size: 10px; color: #fb7185; background: rgba(244,63,94,0.15); padding: 4px; border-radius: 4px; border: 1px solid rgba(244,63,94,0.3);">
            ⚠️ ${camp.hazard_exclusion_reason}
          </p>
        ` : ''}
      </div>
    `);

    marker.addTo(layerGroup);
  });
}
