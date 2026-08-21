/**
 * NivaranAI - User Location Leaflet Layer
 * 
 * Renders the pulsing device GPS position marker and accuracy halo radius.
 */

import L from 'leaflet';
import { UserLocationState } from '../../../types';

export function renderUserLocationLayer(
  layerGroup: L.LayerGroup,
  userLocation: UserLocationState
): void {
  layerGroup.clearLayers();

  const lat = Number(userLocation.latitude);
  const lng = Number(userLocation.longitude);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

  // 1. Subtle accuracy halo if GPS accuracy radius is available
  if (userLocation.accuracy && userLocation.accuracy > 0 && userLocation.accuracy < 3000) {
    const accuracyCircle = L.circle([lat, lng], {
      radius: userLocation.accuracy,
      color: '#3b82f6',
      weight: 1,
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      dashArray: '4, 6'
    });
    accuracyCircle.addTo(layerGroup);
  }

  // 2. Pulsing Blue Marker
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 26px; height: 26px;">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.35);
          animation: pulse-ring 2s infinite;
        "></div>
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #2563eb;
          border: 3px solid #ffffff;
          box-shadow: 0 0 14px rgba(37, 99, 235, 0.85);
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });

  const marker = L.marker([lat, lng], {
    icon: userIcon,
    zIndexOffset: 1000
  });

  const formattedTime = userLocation.timestamp
    ? new Date(userLocation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Active';

  marker.bindPopup(`
    <div style="padding: 6px 8px; font-size: 11px; min-width: 180px; line-height: 1.45; color: #f8fafc; font-family: inherit;">
      <strong style="color: #60a5fa; font-size: 12px; display: block; margin-bottom: 4px;">📍 Your Current GPS Location</strong>
      <p style="color: #cbd5e1; margin: 2px 0;">Latitude: <b>${lat.toFixed(5)}° N</b></p>
      <p style="color: #cbd5e1; margin: 2px 0;">Longitude: <b>${lng.toFixed(5)}° E</b></p>
      <p style="color: #cbd5e1; margin: 2px 0;">GPS Accuracy: <b>±${userLocation.accuracy ? Math.round(userLocation.accuracy) : '15'}m</b></p>
      <p style="color: #94a3b8; font-size: 10px; margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 3px;">
        Recorded: ${formattedTime}
      </p>
    </div>
  `);

  marker.addTo(layerGroup);
}
