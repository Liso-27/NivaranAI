/**
 * NivaranAI - Safe Places Leaflet Layer
 * 
 * Renders hospitals, shelters, fire stations, and police posts with informative popups.
 */

import L from 'leaflet';
import { SafePlace } from '../../../types';

export function renderSafePlacesLayer(
  layerGroup: L.LayerGroup,
  safePlaces: SafePlace[],
  showSafePlaces: boolean
): void {
  layerGroup.clearLayers();

  if (!showSafePlaces) return;

  // Filter out government camps which have their own layer renderer
  const places = safePlaces.filter(
    p => p.type !== 'government_camp' && p.type !== 'temporary_camp'
  );

  places.forEach(place => {
    const isExcluded = place.is_hazard_excluded;
    const isFull = place.status === 'FULL' || place.status === 'CLOSED';

    const markerColor = isExcluded 
      ? '#64748b' 
      : place.type === 'hospital' 
      ? '#f43f5e' 
      : place.type === 'fire_station'
      ? '#f97316'
      : place.type === 'police_station'
      ? '#3b82f6'
      : '#10b981';

    const iconSymbol = place.type === 'hospital' 
      ? '🏥' 
      : place.type === 'police_station' 
      ? '👮' 
      : place.type === 'fire_station' 
      ? '🚒' 
      : '🏛️';

    const tot = Number(place.total_capacity) || Number(place.capacity) || 0;
    const occ = Number(place.occupied_capacity) || 0;
    const availableBeds = typeof place.available_beds === 'number' ? place.available_beds : Math.max(0, tot - occ);

    const icon = L.divIcon({
      className: 'custom-safe-marker',
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
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          opacity: ${isExcluded || isFull ? 0.65 : 1};
          cursor: pointer;
          white-space: nowrap;
        ">
          <span>${iconSymbol}</span>
          <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis;">${(place.name || 'Facility').split(' ')[0]}</span>
          ${availableBeds > 0 ? `<span style="background: rgba(16,185,129,0.2); color: #34d399; font-size: 9px; padding: 1px 4px; border-radius: 4px; font-weight: 700;">${availableBeds}</span>` : ''}
        </div>
      `,
      iconAnchor: [35, 16]
    });

    const marker = L.marker([place.latitude, place.longitude], { icon });

    marker.bindPopup(`
      <div style="padding: 6px 8px; font-size: 11px; min-width: 190px; line-height: 1.4; color: #f8fafc;">
        <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: ${markerColor}; margin-bottom: 2px;">
          ${(place.type || 'Facility').replace('_', ' ')} ${place.is_hazard_excluded ? '(HAZARD EXCLUDED)' : ''}
        </div>
        <h4 style="font-size: 12px; font-weight: 700; color: #ffffff; margin: 2px 0 4px;">${place.name}</h4>
        <p style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">${place.address}</p>
        
        <div style="font-size: 11px; color: #e2e8f0; display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
          <span>Capacity: <b>${occ}/${tot}</b></span>
          <span style="color: ${availableBeds > 0 ? '#34d399' : '#f87171'}; font-weight: 700;">
            ${availableBeds > 0 ? `${availableBeds} beds free` : 'Full'}
          </span>
        </div>

        ${place.facilities && place.facilities.length > 0 ? `
          <div style="margin-top: 4px; font-size: 10px; color: #cbd5e1;">
            <b>Facilities:</b> ${place.facilities.join(', ')}
          </div>
        ` : ''}

        ${place.contact_number ? `
          <div style="margin-top: 4px; font-size: 10px; color: #38bdf8;">
            <b>Contact:</b> ${place.contact_number}
          </div>
        ` : ''}

        ${place.hazard_exclusion_reason ? `
          <p style="margin-top: 6px; font-size: 10px; color: #fb7185; background: rgba(244,63,94,0.15); padding: 4px; border-radius: 4px; border: 1px solid rgba(244,63,94,0.3);">
            ⚠️ ${place.hazard_exclusion_reason}
          </p>
        ` : ''}
      </div>
    `);

    marker.addTo(layerGroup);
  });
}
